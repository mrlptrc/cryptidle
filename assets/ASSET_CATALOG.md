# Asset catalog
## Included actual images
| Group | Contents | Status |
| --- | --- | --- |
| references/concepts | Three-class concept board with environment vignette | Proposed direction |
| characters/warrior | Newly generated isolated warrior source | Draft; alpha/direction cleanup required |
| environments/*/reference.png | Four existing repository environments | Existing reference |
| monsters/*/reference.png | Existing bat, rat and slime images | Existing reference |
| references/rejected | Old block warrior and mage | Negative examples; never integrate as new final art |
| references/provenance | Existing repository manifest | Historical provenance only |

The new warrior has an alpha channel, but its generated output includes soft translucent
edge/background pixels and a more front/left-facing stance than requested.
It must be cleaned and direction-checked before runtime use. Do not call it a finished cutout.

## Required production inventory
- Four base classes; each needs model, portrait, action frames, sheets and metadata.
- Warrior pilot first: idle, walk and attack; then skill, hurt, death and opposite direction.
- Bat pilot: flight, movement, attack, hurt and death.
- Remaining current monsters and bosses: inventory from current game content IDs before production.
- Specialization visuals and skins: produce after designs and gameplay naming are approved.
- Environment overlays: fog, foreground vegetation, lantern light, ripples, chimney smoke.
- Equipment/material/consumable icons: enumerate current definitions before production.
- UI: panel edges, slots, rarity indicators, cursor states.
- VFX: melee impact, magic, healing, death, ordinary loot and rare loot.

## Status lifecycle
missing -> draft -> reviewed -> approved -> integrated
Approval and runtime readiness are independent. A visually approved illustration may
still lack a valid animation sheet. Record both in art-kit.manifest.json.
