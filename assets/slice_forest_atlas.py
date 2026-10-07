"""Slice the original generated 4x4 forest-combat art into fixed Phaser sheets."""
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "forest-combat-atlas.png"
DEST = ROOT / "apps" / "web" / "public" / "art"
CELL_W, CELL_H = 160, 112
FRAME_NAMES = ("forest-warrior", "forest-rat", "forest-slime", "forest-bat")


def bounds(frame: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = frame.getchannel("A").point(lambda value: value if value >= 96 else 0)
    return alpha.getbbox()


def main() -> None:
    atlas = Image.open(SOURCE).convert("RGBA")
    if atlas.width % 4 or atlas.height % 4:
        raise ValueError(f"Expected a 4x4 atlas; got {atlas.size}")
    source_w, source_h = atlas.width // 4, atlas.height // 4
    DEST.mkdir(parents=True, exist_ok=True)

    for row, name in enumerate(FRAME_NAMES):
        frames: list[Image.Image] = []
        boxes: list[tuple[int, int, int, int]] = []
        for col in range(4):
            frame = atlas.crop((col * source_w, row * source_h, (col + 1) * source_w, (row + 1) * source_h))
            if row in (1, 2):
                # The generated atlas has a few alpha wisps crossing the row boundary;
                # this crop removes those stray pixels while leaving the creature poses intact.
                frame.paste((0, 0, 0, 0), (0, 0, source_w, 28))
            box = bounds(frame)
            if box is None:
                raise ValueError(f"Empty sprite in row {row}, frame {col}")
            frames.append(frame)
            boxes.append(box)

        max_w = max(box[2] - box[0] for box in boxes)
        max_h = max(box[3] - box[1] for box in boxes)
        scale = min((CELL_W - 8) / max_w, (CELL_H - 12) / max_h)
        sheet = Image.new("RGBA", (CELL_W * 4, CELL_H), (0, 0, 0, 0))
        for col, (frame, box) in enumerate(zip(frames, boxes, strict=True)):
            sprite = frame.crop(box)
            size = (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale)))
            sprite = sprite.resize(size, Image.Resampling.LANCZOS)
            sprite.putalpha(sprite.getchannel("A").point(lambda value: 0 if value < 12 else value))
            x = col * CELL_W + (CELL_W - size[0]) // 2
            baseline = 78 if name == "forest-bat" else 104
            y = baseline - size[1]
            sheet.alpha_composite(sprite, (x, y))
        output = DEST / f"{name}.png"
        sheet.save(output, optimize=True)
        check = Image.open(output)
        assert check.size == (CELL_W * 4, CELL_H)
        assert check.mode == "RGBA" and check.getchannel("A").getextrema()[0] == 0
        print(f"{output.relative_to(ROOT)}: {check.size}, frames=4, alpha=transparent")


if __name__ == "__main__":
    main()
