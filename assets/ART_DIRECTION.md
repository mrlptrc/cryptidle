# Art direction — Cryptidle
## Direction
Dark fantasy with charming, detailed, anime-stylized 2D characters. Classic Ragnarok and
Tree of Savior are inspirations for proportions and readability, not sources of copied assets.
The class concept board is the primary visual proposal. It is not a technical spritesheet.
Seek coherent detail between character and environment; avoid block figures on ornate backgrounds.

## Character identities
- Warrior: chestnut hair, layered steel armor, brown leather, burgundy scarf/cape,
  sword in anatomical right hand, shield in left. Broad protected silhouette.
- Mage: violet hair, teal/plum layered robes, distinctive hat, amber crystal staff.
- Priest: silver hair, ivory/gold robes, deep green cape, sacred lantern staff.
- Archer: proposed design only; moss-green cloak, leather, bow silhouette,
  ochre accents. No approved model exists yet.
Clothes and appearance follow class/skin for now. Equipment-by-equipment body overlays
are a proposal for later, not part of this kit.

## Technical starting point — validate before batch production
- Production frame proposal: 192 x 192 RGBA; actor about 100–130 pixels tall.
- Source concepts may be larger. A high-resolution concept is not a 192px sprite.
- Fixed slightly elevated three-quarter camera; identical camera across action frames.
- Light from upper left; restrained warm highlights, cool shadow colors.
- Ground pivot stays stable; preserve intended pose movement relative to pivot.
- No background, checkerboard pixels, text, grid, or baked ground shadow in actor textures.
- Character shadow is a separate effect. Flying actors move independently of ground shadow.
- Keep weapons, wings and capes inside frame with sufficient padding.
- Check pixel density at actual rendering size; avoid arbitrary fractional scaling.
- Do not blindly mirror asymmetric weapons/shields; inspect anatomical handedness.
- Do not turn a front-facing pose into a claimed right-facing sprite by metadata alone.

## Palette proposal
Background #101B1C; stone #69716C; teal #477F7C; ember #D7AA60;
steel #9BA6B0; leather #71523B; burgundy #812F46; ivory #E8DCC3.
Use as guides, not a claim that existing images use this exact palette.

## Environments
Keep the combat floor calmer than surrounding foliage/ruins.
Town: warm windows, chimneys, restrained lantern light.
Forest: ash-green vegetation, teal lights, thin low fog.
Swamp: violet distance, wet stone, subtle ripples.
Crypt: weathered stone, dust, sparse supernatural lighting.
Existing files are flattened scenes. Their layers cannot be assumed to exist;
foreground, fog, lighting and moving props need separately authored assets.

## UI and items
Readable icons with one clear silhouette, consistent camera and lighting.
Rarity must be represented by label/icon as well as color.
Proposed colors: common gray, uncommon green, rare blue, epic purple,
legendary amber, mythic crimson. Six rarities still require gameplay approval.
Do not place readable UI text inside generated raster illustrations.

## Approval gate
Review one warrior + bat + forest composition at actual game scale before mass production.
Check pose, scale, silhouette, background separation, alpha and animation continuity.
Only the owner can promote a candidate to visually approved.
