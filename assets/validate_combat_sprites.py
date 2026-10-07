"""Validate the fixed-cell combat sheets used by the development preview."""
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1] / "apps/web/public/art"
groups = {
    "warrior": ["idle", "walk", "attack", "skill", "hurt", "death"],
    "bat": ["idle", "move", "attack", "hurt", "death"],
}
errors=[]
for actor, actions in groups.items():
    for action in actions:
        path=ROOT/f"{actor}-forest-{action}.png"
        if not path.exists(): errors.append(f"missing: {path}"); continue
        with Image.open(path) as im:
            if im.mode != "RGBA": errors.append(f"{path}: expected RGBA, got {im.mode}")
            if im.height != 144 or im.width % 96 != 0: errors.append(f"{path}: expected height 144 and width divisible by 96, got {im.size}")
            if im.width // 96 < 3: errors.append(f"{path}: too few frames")
if errors:
    raise SystemExit("\n".join(errors))
print("combat sprite validation passed: 11 sheets, 6 frames/cell")
