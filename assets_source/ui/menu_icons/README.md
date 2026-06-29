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

Prompt intent:

- Settings: ornate gunmetal and antique-gold gear with cyan crystal core.
- Ranking: antique-gold trophy with navy enamel and cyan gems.
- Screenshot: magical dark-navy camera with gold trim and cyan lens.
- World map: folded parchment map with route markings and a gold compass pin.
