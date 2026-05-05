# Asset Processing Rules

Use these rules when generating, extracting, cleaning, or converting game raster assets.

## Runtime Outputs

- Runtime raster assets should be saved as WebP whenever the engine/browser path supports it.
- Keep runtime assets under `public/assets`.
- Update source references when converting an existing runtime asset from PNG to WebP.

## Reversible Intermediates

- Keep source and intermediate files in a reversible, lossless state.
- Store non-runtime sources under `assets_source/<category>/<asset-name>/`.
- Preserve the original source image when available.
- Preserve lossless processing outputs such as cropped PNG frames, source strips, transparent strips, and metadata describing crop boxes or processing settings.

## Transparency

- When removing a background, bias toward preserving subject pixels.
- Prefer conservative, border-connected background removal over aggressive global color deletion.
- Do not make retained subject pixels partially transparent unless the artwork intentionally requires translucency.
- If in doubt, leave a small safe edge or shadow rather than cutting into hair, outlines, glow, or pale clothing.
