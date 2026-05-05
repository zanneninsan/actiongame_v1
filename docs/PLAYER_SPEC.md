# Player-Facing Game Spec / コアプレイヤー向け仕様書

This document records gameplay rules for players who want to understand scoring, routing, and mechanical details precisely.

## Status

- Last updated from code state: `v0.1.198`
- Stomp defeat: closed
- Stomp combo: documented below

## Score Sources

### Items

| Item | Points | Notes |
| --- | ---: | --- |
| Energy drink | 100 | Score item. |
| Shopping bag | 250 | Score item. |
| Bubble tea | 150 | Score item. |
| Coin | 25 | Also increments the coin count shown in the mission summary. |
| Speed power-up | 0 | Grants a temporary speed multiplier. |
| Jump power-up | 0 | Grants a temporary jump multiplier. |
| Star | 0 | Grants temporary star invulnerability. |
| Dash ring | 0 | Grants a short forward dash boost. |

### Enemy Stomp Score

Enemy stomp score is added as bonus score. If an enemy does not define a custom stomp score, its base stomp score is 10.

| Enemy | Base Stomp Score |
| --- | ---: |
| Knife Punk | 10 |
| Aqua Mascot | 10 |
| Horned Cyborg | 20 |
| Cone Golem | 15 |
| Rabbit Traveler | 20 |
| Neon Idol | 30 |
| Heart Cannon | 25 |

## Stomp Combo

The stomp combo increases the score multiplier when enemies are stomped in quick succession.

### Combo Condition

- A stomp starts or continues the combo when the next enemy stomp happens within 1400 ms of the previous enemy stomp.
- If more than 1400 ms passes between enemy stomps, the next stomp starts over at combo 1.
- Landing on the floor resets the current combo count to 0.
- Stomping an enemy bounces the player upward, so another stomp can continue the combo before landing.

### Score Formula

```text
stomp points = enemy base stomp score * current stomp combo count
```

Examples:

| Sequence | Enemy Base Score | Combo Count | Awarded Points |
| --- | ---: | ---: | ---: |
| First stomp | 10 | 1 | 10 |
| Second quick stomp | 10 | 2 | 20 |
| Third quick stomp | 20 | 3 | 60 |
| Stomp after landing | 10 | 1 | 10 |

### On-Screen Popup

- Combo 1 shows only the gained score, such as `+10`.
- Combo 2 or higher shows the gained score and combo count, such as `+20 x2`.

## Power-Ups

| Power-Up | Duration | Effect |
| --- | ---: | --- |
| Speed | 9000 ms | Multiplies player speed by 1.28. |
| Jump | 9000 ms | Multiplies jump velocity by 1.18. |
| Star | 9000 ms | Sets the star invulnerability timer. |
| Dash ring | 900 ms | Sets horizontal velocity to 720 in the facing direction and applies the speed multiplier during the boost. |

## Clear Rank

Clear rank is calculated from three bonuses.

| Bonus | Condition | Rank Score |
| --- | --- | ---: |
| No damage | Damage taken is 0 | 1 |
| Fast clear | Remaining time is at least 55% of total stage time | 1 |
| Score bonus | Final score is at least 4200 | 1 |
| Partial score bonus | Final score is at least 2600 and below 4200 | 0.5 |

Rank thresholds:

| Rank | Required Rank Score |
| --- | ---: |
| S | 2.5 or higher |
| A | 1.5 or higher |
| B | 0.5 or higher |
| C | Below 0.5 |

## Mission Summary

The clear mission summary currently reports:

- Damage state: `NO DMG OK` or `DMG n`
- Collected coin count: `COIN n`
- Fast clear state: `FAST OK` or `FAST --`
