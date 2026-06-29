# Menu Icon Sources

Generated with the built-in image generation tool for fantasy-style canvas menu icons.

Runtime outputs:

- `public/assets/ui/menu_icons/settings_gear.webp`
- `public/assets/ui/menu_icons/ranking_trophy.webp`
- `public/assets/ui/menu_icons/screenshot_camera.webp`
- `public/assets/ui/menu_icons/world_map.webp`

Source processing:

- Generated on a flat green chroma-key background.
- Background removed with `remove_chroma_key.py --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`.
- Cropped to alpha bounds, padded, resized to 256x256, and exported as WebP quality 92.

Simple replacements:

- `settings_gear_simple_source.png`
- `ranking_trophy_simple_source.png`
- `screenshot_camera_simple_source.png`
- `world_map_simple_source.png`
- `simple_preview_60px.png`

Prompt intent:

- Settings: ornate gunmetal and antique-gold gear with cyan crystal core.
- Ranking: antique-gold trophy with navy enamel and cyan gems.
- Screenshot: magical dark-navy camera with gold trim and cyan lens.
- World map: folded parchment map with route markings and a gold compass pin.

Simple prompt intent:

- Settings: simple gear silhouette with gold rim and small cyan center.
- Ranking: simple gold trophy cup with handles and base.
- Screenshot: simple dark-navy camera body with gold accents and cyan lens.
- World map: simple folded parchment map with a cyan route line.
