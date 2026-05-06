# Stage Design Notes

## Bonus Blocks

Question, hidden, and breakable blocks are solid physics bodies. Hidden blocks are invisible before they are hit, so bad placement feels like a mysterious wall.

When placing any bonus block:

- Leave a clear pass-through space below the block. Do not place floor or platform tiles directly under the block.
- Keep enough vertical room under the block for the player to move through and jump into it from below.
- Spread blocks across gaps and open lanes, not only above existing platforms.
- For blocks above the 672px ground line, a center y around 440-470 usually lets the player pass below and hit the block with a normal jump.
- Avoid placing hidden blocks on top of enemies, enemy spawn points, patrol paths, checkpoints, goals, or required landing spots.
- If a block sits near a route the player must take, make the block visible unless the surrounding geometry clearly signals the secret.

As a practical layout check, the rectangle under the block should be empty for at least the player's body width plus a small margin, and the block bottom should not sit immediately above another solid surface.
