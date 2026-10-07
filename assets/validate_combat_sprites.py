"""Validate the fixed-cell combat sheets used by the development preview."""
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1] / "apps/web/public/art"
groups = {
    "warrior": {"idle": 6, "walk": 6, "attack": 6, "skill": 6, "hurt": 3, "death": 6},
    "bat": {"idle": 6, "move": 6, "attack": 6, "hurt": 3, "death": 6},
}
errors=[]
for actor, actions in groups.items():
    for action, expected_frames in actions.items():
        path=ROOT/f"{actor}-forest-{action}.png"
        if not path.exists(): errors.append(f"missing: {path}"); continue
        with Image.open(path) as im:
            if im.mode != "RGBA": errors.append(f"{path}: expected RGBA, got {im.mode}")
            if im.height != 144 or im.width % 112 != 0: errors.append(f"{path}: expected height 144 and width divisible by 112, got {im.size}")
            actual_frames=im.width // 112
            if actual_frames != expected_frames: errors.append(f"{path}: metadata expects {expected_frames} frames, found {actual_frames}")
            indices=list(range(expected_frames))
            if any(index < 0 or index >= actual_frames for index in indices): errors.append(f"{path}: frame index outside sheet bounds")
if errors:
    raise SystemExit("\n".join(errors))
print("combat sprite validation passed: 11 sheets, dimensions, RGBA and frame indexes")
