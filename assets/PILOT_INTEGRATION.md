# Art kit import and Warrior/Bat pilot

Imported on 2026-10-07 from `cryptidle-art-kit` on branch `feat/v3-art-kit-import`.
This file records what the kit is, what the game renders today, and what real art is
still missing. It follows [AGENTS.md](AGENTS.md). Nothing here is owner-approved art.

## Import result
- All kit files were copied with no-overwrite. No kit path collided with an existing file,
  so `manifest.json`, the sprite scripts and `forest-combat-atlas.png` are untouched.
- `art-kit.manifest.json` is kept separate from `manifest.json`; no schema mapping was done.
- All 11 images match the SHA-256 values in `art-kit.manifest.json`.
- No kit image is referenced by runtime code. `apps/web/public/art` is unchanged.
- `pnpm validate:assets` still passes (11 runtime sheets).

## Images inspected
| Kit image | What it actually is | Usable as |
| --- | --- | --- |
| `references/concepts/cryptidle-class-board.png` | 1536×1024 RGB board: Warrior/Mage/Priest turnarounds, palettes, three key poses each, labels baked in, forest scene with the party and a bat | Direction reference only. Not a spritesheet: no grid, no transparency, text in the image, poses are not consecutive frames. |
| `characters/warrior/reference.png` | 1536×1024 RGBA single pose matching the board (chestnut hair, steel, burgundy scarf/cape, sword in anatomical right hand, shield in left) | Model source. It has a visible dark/red glow matte around the figure and faces screen-left in a front three-quarter view, so it is **not** a right-facing cutout and not a frame. |
| `monsters/shadow-bat/reference.png` | Same file as runtime `forest-bat.png`: 4 separate poses | Existing reference; 4 poses are not a full flight cycle. |
| `monsters/crypt-rat`, `monsters/forest-slime` | Same files as runtime `forest-rat.png`, `forest-slime.png` | Existing reference. |
| `environments/*/reference.png` | Same files as runtime backgrounds | Existing reference (see mapping note). |
| `references/rejected/block-warrior.png`, `block-mage.png` | Same files as runtime `warrior-0.png`, `mage-0.png` | Negative examples. **These are still used by the game today.** |

### Environment mapping conflict
The kit labels `citadel.png` as "swamp". The game currently renders
`hollow → forest.png`, `marsh → crypt.png`, `crypt → citadel.png`, and the boss also uses
`citadel.png` (`apps/web/src/World.tsx`). The kit's folder names are organizational and
do not match the runtime. Owner decision needed: which image represents which region.

## What the game renders today (not approved)
- Warrior and Bat combat sheets (`warrior-forest-*.png`, `bat-forest-*.png`, 112×144 cells):
  procedural Pillow drawings from `assets/generate_detailed_sprites.py`. They are geometric
  figures and do not match the concept. They stay as the working fallback until real
  frames are approved.
- `warrior-0/1`, `mage-0/1`, `priest-0/1` portraits and sprites, plus `monster-0..9`: simple block
  figures (two of them are the kit's rejected examples).

## Missing production art (inventory from current game content)
| Area | Needed | Current |
| --- | --- | --- |
| Classes | Warrior, Mage, Priest: model, portrait, idle/walk/attack/skill/hurt/death, both directions. Archer: design first (proposal only). | Block figures; procedural Warrior forest sheet |
| Monsters | `rat`, `slime`, `bat` (Bosque); `skeleton`, `wisp`, `spider` (Pântano); `knight`, `shade`, `golem` (Cripta) | 3 forest monsters have 4-pose sheets; 6 are block figures |
| Boss | Guardião do Eclipse | No dedicated art |
| Skill icons | `cleave`, `bulwark`, `rush`, `firebolt`, `barrier`, `haste`, `smite`, `renew`, `ward` | All use one generic `skill.png` |
| Equipment icons | 24 definitions `hollow-0..7`, `marsh-0..7`, `crypt-0..7` | One icon per slot (`weapon`, `head`, `chest`, `accessory`) |
| VFX | melee impact, magic, healing, death, loot, rare loot | None (text floats only) |
| UI | panel frames, slots, rarity markers, cursors | CSS only |
| Environment overlays | fog, foreground, lantern light, ripples, smoke | Flattened backgrounds only |

## Warrior/Bat pilot: integration plan
Prepared, not started: there are no real frames to integrate yet.

1. **Art production (owner or artist with image tools).** Starting from `characters/warrior/reference.png`
   and the board, produce real frames per `characters/warrior/animations.json`:
   192×192 RGBA, right-facing three-quarter view, a clean alpha with no glow matte, and a stable ground pivot.
   Order: idle 6, walk 8, attack 8; then skill, hurt, death and the left direction. Do not mirror
   blindly, because the shield and sword hands matter. Bat: flight/idle, move, attack, hurt, death; the shadow is separate.
   Put frames in `characters/<actor>/frames/`, untouched.
2. **Assembly (tooling allowed).** Pack frames into sheets in `characters/<actor>/sheets/`
   and fill `texture`, `frames`, `durations_ms`, `impact_frame` and `pivot` in `animations.json`.
   Tooling may only assemble and validate. It must not invent in-between poses.
3. **Validation.** Extend `assets/validate_combat_sprites.py` to the 192×192 cell and to the
   kit's `animations.json`. Then go through `previews/REVIEW_CHECKLIST.md` at game scale on `/dev/animations`.
4. **Owner approval.** Mark the asset `approved` in `art-kit.manifest.json`, separately from `runtime_ready`.
5. **Runtime swap.** Only then copy the derivatives to `apps/web/public/art/` under new names. Point
   `apps/web/src/combatAssets.ts` (warrior/bat `cell`, `pivot`, `actions[].file/frames`) at them,
   keeping the procedural sheets as fallback. Animation stays driven by server combat events;
   no rewards in callbacks.

Owner decisions blocking the pilot: approve the Warrior model from the board, confirm the
192×192 frame size (the runtime uses 112×144 today), and resolve the region/background mapping above.
