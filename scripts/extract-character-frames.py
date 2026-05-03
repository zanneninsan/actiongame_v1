#!/usr/bin/env python3
"""Extract character-like frames from a video and remove edge-connected backgrounds.

The background remover is intentionally conservative: it only clears pixels that
are both close to the estimated outer background color and connected to the
image border. That keeps similarly colored details inside the character intact.
"""

from __future__ import annotations

import argparse
import json
import math
import shutil
import subprocess
import tempfile
from collections import Counter, deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

try:
    from scipy import ndimage
except ImportError:  # pragma: no cover - fallback is for lean Python installs.
    ndimage = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract unique transparent character frames from a video."
    )
    parser.add_argument("video", type=Path, help="Input video path.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Output directory. Defaults to public/assets/sprites/video_extract/<video stem>.",
    )
    parser.add_argument(
        "--fps",
        type=float,
        default=0,
        help="Optional extraction FPS. 0 keeps every decoded video frame.",
    )
    parser.add_argument(
        "--bg-tolerance",
        type=float,
        default=58,
        help="RGB distance tolerance for edge-connected background removal.",
    )
    parser.add_argument(
        "--fringe-passes",
        type=int,
        default=1,
        help="Conservative passes that clear background-colored pixels touching removed background.",
    )
    parser.add_argument(
        "--fringe-tolerance",
        type=float,
        default=78,
        help="RGB distance tolerance for the edge fringe cleanup pass.",
    )
    parser.add_argument(
        "--duplicate-threshold",
        type=float,
        default=4.2,
        help="Mean thumbnail difference below this value is treated as a near duplicate.",
    )
    parser.add_argument(
        "--border",
        type=int,
        default=10,
        help="Outer border width used to estimate the background color.",
    )
    parser.add_argument(
        "--crop-padding",
        type=int,
        default=3,
        help="Transparent padding left around each extracted character.",
    )
    return parser.parse_args()


def run_ffmpeg(video: Path, frame_dir: Path, fps: float) -> None:
    if not shutil.which("ffmpeg"):
        raise SystemExit("ffmpeg was not found on PATH.")

    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(video)]
    if fps > 0:
        command.extend(["-vf", f"fps={fps}"])
    command.extend([str(frame_dir / "frame_%06d.png")])
    subprocess.run(command, check=True)


def estimate_background_color(rgb: np.ndarray, border: int) -> np.ndarray:
    height, width, _ = rgb.shape
    edge = min(border, max(1, height // 5), max(1, width // 5))
    samples = np.concatenate(
        [
            rgb[:edge, :, :].reshape(-1, 3),
            rgb[-edge:, :, :].reshape(-1, 3),
            rgb[:, :edge, :].reshape(-1, 3),
            rgb[:, -edge:, :].reshape(-1, 3),
        ],
        axis=0,
    )
    buckets = (samples // 16).astype(np.uint8)
    most_common_bucket = Counter(map(tuple, buckets)).most_common(1)[0][0]
    bucket_mask = np.all(buckets == np.array(most_common_bucket, dtype=np.uint8), axis=1)
    return samples[bucket_mask].mean(axis=0)


def edge_connected_background_mask(
    rgb: np.ndarray, bg_color: np.ndarray, tolerance: float
) -> np.ndarray:
    height, width, _ = rgb.shape
    diff = np.linalg.norm(rgb.astype(np.float32) - bg_color.astype(np.float32), axis=2)
    close = diff <= tolerance

    if ndimage is not None:
        seeds = np.zeros((height, width), dtype=bool)
        seeds[0, :] = close[0, :]
        seeds[-1, :] = close[-1, :]
        seeds[:, 0] = close[:, 0]
        seeds[:, -1] = close[:, -1]
        return ndimage.binary_propagation(seeds, mask=close)

    visited = np.zeros((height, width), dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    def add_seed(x: int, y: int) -> None:
        if close[y, x] and not visited[y, x]:
            visited[y, x] = True
            queue.append((x, y))

    for x in range(width):
        add_seed(x, 0)
        add_seed(x, height - 1)
    for y in range(height):
        add_seed(0, y)
        add_seed(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height and close[ny, nx] and not visited[ny, nx]:
                visited[ny, nx] = True
                queue.append((nx, ny))

    return visited


def cleanup_edge_fringe(
    rgb: np.ndarray,
    bg_mask: np.ndarray,
    bg_color: np.ndarray,
    tolerance: float,
    passes: int,
) -> np.ndarray:
    if passes <= 0:
        return bg_mask

    diff = np.linalg.norm(rgb.astype(np.float32) - bg_color.astype(np.float32), axis=2)
    mask = bg_mask.copy()
    for _ in range(passes):
        if ndimage is not None:
            expanded = ndimage.binary_dilation(mask)
        else:
            expanded = mask.copy()
            expanded[:-1, :] |= mask[1:, :]
            expanded[1:, :] |= mask[:-1, :]
            expanded[:, :-1] |= mask[:, 1:]
            expanded[:, 1:] |= mask[:, :-1]
        fringe = expanded & ~mask & (diff <= tolerance)
        if not fringe.any():
            break
        mask |= fringe
    return mask


def remove_outer_background(
    image: Image.Image,
    border: int,
    tolerance: float,
    fringe_tolerance: float,
    fringe_passes: int,
) -> Image.Image:
    rgba = image.convert("RGBA")
    data = np.array(rgba)
    rgb = data[:, :, :3]
    bg_color = estimate_background_color(rgb, border)
    bg_mask = edge_connected_background_mask(rgb, bg_color, tolerance)
    bg_mask = cleanup_edge_fringe(rgb, bg_mask, bg_color, fringe_tolerance, fringe_passes)
    data[bg_mask, 3] = 0
    return Image.fromarray(data, mode="RGBA")


def crop_to_alpha(image: Image.Image, padding: int) -> Image.Image:
    alpha = np.array(image.getchannel("A"))
    ys, xs = np.where(alpha > 0)
    if len(xs) == 0 or len(ys) == 0:
        return image
    left = max(0, int(xs.min()) - padding)
    right = min(image.width, int(xs.max()) + padding + 1)
    top = max(0, int(ys.min()) - padding)
    bottom = min(image.height, int(ys.max()) + padding + 1)
    return image.crop((left, top, right, bottom))


def comparison_thumb(image: Image.Image, size: int = 96) -> np.ndarray:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    scale = min(size / image.width, size / image.height)
    new_size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    resized = image.resize(new_size, Image.Resampling.LANCZOS)
    canvas.alpha_composite(resized, ((size - new_size[0]) // 2, (size - new_size[1]) // 2))

    arr = np.array(canvas).astype(np.float32)
    alpha = arr[:, :, 3:4] / 255.0
    premultiplied = arr[:, :, :3] * alpha
    return np.concatenate([premultiplied, arr[:, :, 3:4]], axis=2)


def frame_difference(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.mean(np.abs(a - b)))


def is_near_duplicate(
    thumb: np.ndarray, kept_thumbs: list[np.ndarray], duplicate_threshold: float
) -> tuple[bool, float | None]:
    if not kept_thumbs:
        return False, None
    differences = [frame_difference(thumb, kept) for kept in kept_thumbs]
    best = min(differences)
    return best <= duplicate_threshold, best


def make_contact_sheet(images: list[Path], output_path: Path) -> None:
    if not images:
        return
    thumbs = []
    for path in images:
        image = Image.open(path).convert("RGBA")
        image.thumbnail((96, 96), Image.Resampling.LANCZOS)
        tile = Image.new("RGBA", (112, 128), (34, 34, 42, 255))
        tile.alpha_composite(image, ((112 - image.width) // 2, 8 + (96 - image.height) // 2))
        thumbs.append(tile)

    columns = min(8, len(thumbs))
    rows = math.ceil(len(thumbs) / columns)
    sheet = Image.new("RGBA", (columns * 112, rows * 128), (18, 18, 22, 255))
    draw = ImageDraw.Draw(sheet)
    for index, tile in enumerate(thumbs):
        x = (index % columns) * 112
        y = (index // columns) * 128
        sheet.alpha_composite(tile, (x, y))
        draw.text((x + 8, y + 108), f"{index:03d}", fill=(230, 230, 236, 255))
    sheet.save(output_path)


def main() -> None:
    args = parse_args()
    video = args.video.resolve()
    if not video.exists():
        raise SystemExit(f"Input video does not exist: {video}")

    repo_root = Path.cwd()
    output_dir = (
        args.output_dir
        if args.output_dir is not None
        else repo_root / "public" / "assets" / "sprites" / "video_extract" / video.stem
    )
    output_dir.mkdir(parents=True, exist_ok=True)
    for pattern in ("character_*.png", "contact_sheet.png", "metadata.json"):
        for stale_path in output_dir.glob(pattern):
            stale_path.unlink()

    kept_paths: list[Path] = []
    kept_thumbs: list[np.ndarray] = []
    skipped_duplicates = 0
    processed = 0
    metadata_frames = []

    with tempfile.TemporaryDirectory(prefix="character_frames_") as tmp:
        frame_dir = Path(tmp)
        run_ffmpeg(video, frame_dir, args.fps)
        frame_paths = sorted(frame_dir.glob("frame_*.png"))

        for frame_path in frame_paths:
            processed += 1
            processed_frame = remove_outer_background(
                Image.open(frame_path),
                args.border,
                args.bg_tolerance,
                args.fringe_tolerance,
                args.fringe_passes,
            )
            cropped = crop_to_alpha(processed_frame, args.crop_padding)
            thumb = comparison_thumb(cropped)
            duplicate, best_difference = is_near_duplicate(
                thumb, kept_thumbs, args.duplicate_threshold
            )
            if duplicate:
                skipped_duplicates += 1
                continue

            output_path = output_dir / f"character_{len(kept_paths):04d}.png"
            cropped.save(output_path)
            kept_paths.append(output_path)
            kept_thumbs.append(thumb)
            metadata_frames.append(
                {
                    "source_frame": frame_path.name,
                    "output": output_path.name,
                    "width": cropped.width,
                    "height": cropped.height,
                    "nearest_kept_difference": best_difference,
                }
            )

    make_contact_sheet(kept_paths, output_dir / "contact_sheet.png")
    metadata = {
        "source_video": str(video),
        "processed_frames": processed,
        "kept_frames": len(kept_paths),
        "skipped_near_duplicates": skipped_duplicates,
        "settings": {
            "fps": args.fps,
            "bg_tolerance": args.bg_tolerance,
            "fringe_passes": args.fringe_passes,
            "fringe_tolerance": args.fringe_tolerance,
            "duplicate_threshold": args.duplicate_threshold,
            "border": args.border,
            "crop_padding": args.crop_padding,
        },
        "frames": metadata_frames,
    }
    (output_dir / "metadata.json").write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print(f"Processed frames: {processed}")
    print(f"Kept frames: {len(kept_paths)}")
    print(f"Skipped near duplicates: {skipped_duplicates}")
    print(f"Output: {output_dir}")


if __name__ == "__main__":
    main()
