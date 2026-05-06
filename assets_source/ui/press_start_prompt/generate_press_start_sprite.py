from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[3]
OUT_DIR = ROOT / "assets_source" / "ui" / "press_start_prompt"
RUNTIME_DIR = ROOT / "public" / "assets" / "ui" / "fantasy"
FRAME_SIZE = (384, 64)
SHEET_SIZE = (FRAME_SIZE[0] * 4, FRAME_SIZE[1])
TEXT = "PRESS TO START"
FONT_PATHS = [
    Path("C:/Windows/Fonts/impact.ttf"),
    Path("C:/Windows/Fonts/arialbd.ttf"),
]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_PATHS:
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default(size=size)


def rounded_rect_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def make_text_mask(font: ImageFont.FreeTypeFont) -> Image.Image:
    mask = Image.new("L", FRAME_SIZE, 0)
    draw = ImageDraw.Draw(mask)
    bbox = draw.textbbox((0, 0), TEXT, font=font, stroke_width=0)
    x = (FRAME_SIZE[0] - (bbox[2] - bbox[0])) // 2
    y = (FRAME_SIZE[1] - (bbox[3] - bbox[1])) // 2 - 3
    draw.text((x, y), TEXT, font=font, fill=255)
    return mask


def pixelate(image: Image.Image, block: int = 2) -> Image.Image:
    small = image.resize((image.width // block, image.height // block), Image.Resampling.NEAREST)
    return small.resize(image.size, Image.Resampling.NEAREST)


def tint(mask: Image.Image, color: tuple[int, int, int, int]) -> Image.Image:
    layer = Image.new("RGBA", mask.size, color)
    layer.putalpha(mask)
    return layer


def offset_mask(mask: Image.Image, dx: int, dy: int) -> Image.Image:
    out = Image.new("L", mask.size, 0)
    out.paste(mask, (dx, dy))
    return out


def make_gradient(mask: Image.Image, alpha_scale: float) -> Image.Image:
    image = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    pixels = image.load()
    mask_pixels = mask.load()
    for y in range(mask.height):
        t = y / max(mask.height - 1, 1)
        if t < 0.38:
            color = (255, 248, 206)
        elif t < 0.64:
            color = (255, 218, 83)
        else:
            color = (215, 126, 18)
        for x in range(mask.width):
            a = int(mask_pixels[x, y] * alpha_scale)
            if a:
                pixels[x, y] = (*color, a)
    return image


def draw_spark(draw: ImageDraw.ImageDraw, x: int, y: int, scale: int, alpha: int) -> None:
    gold = (255, 236, 142, alpha)
    white = (255, 255, 245, alpha)
    draw.rectangle((x - scale, y, x + scale, y), fill=gold)
    draw.rectangle((x, y - scale, x, y + scale), fill=gold)
    draw.point((x, y), fill=white)


def make_frame(frame_index: int, alpha_scale: float, sparkle_shift: int) -> Image.Image:
    font = load_font(42)
    text_mask = make_text_mask(font)
    frame = Image.new("RGBA", FRAME_SIZE, (0, 0, 0, 0))

    black_back = rounded_rect_mask((FRAME_SIZE[0] - 32, FRAME_SIZE[1] - 14), 11)
    black_layer = Image.new("L", FRAME_SIZE, 0)
    black_layer.paste(black_back, (16, 7))
    black_layer = black_layer.filter(ImageFilter.GaussianBlur(0.6))
    frame.alpha_composite(tint(black_layer, (7, 4, 3, int(210 * alpha_scale))))

    dot_draw = ImageDraw.Draw(frame)
    for y in range(13, FRAME_SIZE[1] - 13, 6):
        for x in range(25 + ((y // 6) % 2) * 3, FRAME_SIZE[0] - 25, 6):
            dot_draw.point((x, y), fill=(146, 74, 11, int(90 * alpha_scale)))

    outline_specs = [
        (8, (53, 27, 4, int(246 * alpha_scale))),
        (6, (0, 0, 0, int(238 * alpha_scale))),
        (4, (255, 228, 117, int(236 * alpha_scale))),
        (2, (126, 66, 6, int(255 * alpha_scale))),
    ]
    for radius, color in outline_specs:
        outline = text_mask.filter(ImageFilter.MaxFilter(radius * 2 + 1))
        frame.alpha_composite(tint(outline, color))

    shadow = offset_mask(text_mask, 4, 4).filter(ImageFilter.GaussianBlur(0.35))
    frame.alpha_composite(tint(shadow, (0, 0, 0, int(205 * alpha_scale))))
    frame.alpha_composite(make_gradient(text_mask, alpha_scale))

    highlight = Image.new("L", FRAME_SIZE, 0)
    highlight_draw = ImageDraw.Draw(highlight)
    highlight_draw.rectangle((0, 15, FRAME_SIZE[0], 28), fill=200)
    highlight = Image.composite(highlight, Image.new("L", FRAME_SIZE, 0), text_mask)
    frame.alpha_composite(tint(highlight, (255, 255, 244, int(156 * alpha_scale))))

    diagonal = Image.new("L", FRAME_SIZE, 0)
    diag_draw = ImageDraw.Draw(diagonal)
    for x in range(-FRAME_SIZE[1], FRAME_SIZE[0], 10):
        diag_draw.line((x, FRAME_SIZE[1] - 6, x + FRAME_SIZE[1], 6), fill=72, width=2)
    diagonal = Image.composite(diagonal, Image.new("L", FRAME_SIZE, 0), text_mask)
    frame.alpha_composite(tint(diagonal, (255, 180, 32, int(120 * alpha_scale))))

    sparkle_draw = ImageDraw.Draw(frame)
    sparkles = [(26, 14), (354, 15), (61, 51), (325, 50), (185, 10)]
    for i, (x, y) in enumerate(sparkles):
        draw_spark(sparkle_draw, x + ((sparkle_shift + i) % 3 - 1) * 2, y, 3 + (i % 2), int(230 * alpha_scale))

    if frame_index == 3:
        frame = frame.point(lambda value: int(value * 0.42) if value else 0)

    return pixelate(frame, 2)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)

    frame_specs = [
        {"name": "bright_a", "alpha": 1.0, "sparkle_shift": 0},
        {"name": "dim", "alpha": 0.55, "sparkle_shift": 1},
        {"name": "bright_b", "alpha": 1.0, "sparkle_shift": 2},
        {"name": "off_glow", "alpha": 0.25, "sparkle_shift": 0},
    ]
    frames = [make_frame(i, spec["alpha"], spec["sparkle_shift"]) for i, spec in enumerate(frame_specs)]

    sheet = Image.new("RGBA", SHEET_SIZE, (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        frame.save(OUT_DIR / f"press_start_prompt_frame_{i + 1:02d}_{frame_specs[i]['name']}.png")
        sheet.alpha_composite(frame, (FRAME_SIZE[0] * i, 0))

    sheet_png = OUT_DIR / "press_start_prompt_sheet.png"
    sheet_webp = RUNTIME_DIR / "press_start_prompt_sheet.webp"
    sheet.save(sheet_png)
    sheet.save(sheet_webp, "WEBP", lossless=True, quality=100, method=6)

    metadata = {
        "text": TEXT,
        "runtime": str(sheet_webp.relative_to(ROOT)).replace("\\", "/"),
        "sourceSheet": str(sheet_png.relative_to(ROOT)).replace("\\", "/"),
        "frameWidth": FRAME_SIZE[0],
        "frameHeight": FRAME_SIZE[1],
        "frames": len(frames),
        "animation": "blink, 1.08s loop, frame order left to right",
        "styleNotes": [
            "gold gradient text",
            "black plaque shadow",
            "cream and amber pixel outlines",
            "small star sparkles matching the title logo",
        ],
    }
    (OUT_DIR / "press_start_prompt_metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
