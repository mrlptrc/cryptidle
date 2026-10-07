# Producing Cryptidle art with ChatGPT

ChatGPT image generation draws well but does not produce game-ready files: it adds
backgrounds and glow, changes body size between poses, misplaces feet and outputs large
soft images. This guide makes the generation predictable, and
`assets/tools/gpt_sprite_pipeline.py` does the technical part (keying, scaling, pixel cleanup,
pivot alignment, packing, checks, previews). The tool never invents poses.

## Already transparent images
If ChatGPT returns a PNG with real transparency (like `references/concepts/four-classes-lineup.png`),
the tool detects it and only removes the faint halo; magenta is not required then.
The magenta rule below is for images that come back with any background.

## Golden rules for every request
1. **One approved model, attached every time.** Generate the character model first; once
   the owner approves it, attach that image (and the class board) to every later request in the same chat.
2. **Flat magenta background `#FF00FF`.** Do not ask for "transparent". GPT's transparency
   leaves soft halos, and dark backgrounds make the tool erase outlines (the tool refuses them).
3. **One action per image, laid out as a grid.** Poses drawn in the same image stay far more
   consistent than poses from separate requests. Use 3×2 for 6 frames, 4×2 for 8.
4. **Same size, same camera, facing right.** Say it explicitly every time.
5. **No text, labels, numbers, borders, grid lines, ground or shadows.**
6. **Ask for each frame to fit inside its cell with margin**, so nothing gets cut.
7. Regenerate rather than repair: if the face or armour changes between poses, discard the image.

## 1. Character model (once per class)
```
Attached: the Cryptidle four-classes lineup. Draw ONLY the [Warrior] from it as one full-body
game sprite model: chibi proportions about 3 heads tall, detailed dark-fantasy pixel art
with clean pixel clusters and a dark outline. Facing RIGHT in a slightly elevated
three-quarter view. [Warrior: dark brown spiky hair, burgundy scarf, steel plates over brown leather,
short sword in his right hand, round wooden shield with a gold cross on his left arm.]
Neutral idle stance, feet on the ground, whole body and weapon visible with margin.
Background: perfectly flat solid magenta #FF00FF, no gradient, no glow, no floor,
no shadow, no text, no border. Single character centered.
```
Approve the model by eye first, then run it through the tool as a 1x1 "model" action to see it at game size.

## 2. Animation frames (one action per request, model attached)
```
Attached: the approved [Warrior] model. Create the [ATTACK] animation as [6] sequential poses
of EXACTLY this character, arranged in a [3 columns x 2 rows] grid read left-to-right,
top-to-bottom. Same character design, same colors, same body size and same camera in every
pose, facing RIGHT, feet on the same ground line inside each cell, each pose centered in its
cell with empty margin around it (nothing crosses into another cell).
Motion: [1 guard, 2 anticipation raising sword, 3 forward step, 4 contact slash,
5 follow-through, 6 recovery back to guard].
Background: perfectly flat solid magenta #FF00FF everywhere. No grid lines, no numbers,
no text, no floor, no shadow, no effects or slash trails (effects are separate assets).
```
Motion beats to paste in:
- **idle (6, loop):** subtle breathing: 1 neutral, 2 chest up, 3 cape sway right, 4 neutral, 5 chest down, 6 cape sway left.
- **walk (8, loop):** right contact, down, passing, up, left contact, down, passing, up.
- **attack (6–8):** guard, anticipation, step, contact, follow-through, recovery.
- **skill (6–8):** like attack, with a distinct stance (shield raised for Bulwark).
- **hurt (3):** impact recoil, max recoil, recovering.
- **death (6):** stagger, knees buckle, falling, hitting ground, settled, settled.
- **bat flight (6, loop):** wings up, opening, horizontal, down, closing, rising.

## 3. Process the image
```sh
python assets/tools/gpt_sprite_pipeline.py downloaded.png --actor warrior --action idle --grid 3x2 --fps 6 --loop
python assets/tools/gpt_sprite_pipeline.py attack.png --actor warrior --action attack --grid 3x2 --fps 10 \
    --impact-frame 3 --scale-from assets/characters/warrior/sheets/idle.json
```
- Process `idle` first. Pass `--scale-from .../idle.json` for every other action so the body
  size is identical across actions.
- `--height` (default 120) is the tallest pose's height in pixels inside the 192×192 cell.
- Outputs: the untouched source plus cleaned frames in `characters/<actor>/frames/<action>/`; the sheet, JSON
  report, `-preview.png` (dark/light/teal grounds, pivot line) and `-preview.gif` in `sheets/`.
  The tool also updates `animations.json` with status `draft`.
- Read every `WARNING`. Body size changing, touching the cell edge or clipping means regenerate.
- Open the GIF: the feet must stay on the line; the face and armour must not "boil".

## 4. Icons and UI
- **Icons:** one object per request, 3/4 view, same upper-left light, dark outline, flat
  magenta background, no text, in the style of the attached approved icons. Process with
  `--grid 1x1 --height 56 --actor icons --action <id>`. A 4x4 grid of 16 icons in one
  request keeps the style consistent; process it with `--grid 4x4`.
- **UI:** never a full screen. Request parts separately (panel corner, edge, slot,
  rarity gem, cursor) on magenta, then assemble them as 9-slice in code. All text stays in the game, never in images.

## 5. Review and approval
Use `assets/previews/REVIEW_CHECKLIST.md`. The owner approves; only then are files copied to
`apps/web/public/art/` and wired in `apps/web/src/combatAssets.ts` (see `assets/PILOT_INTEGRATION.md`).
