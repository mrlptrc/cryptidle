"""Turn a ChatGPT-generated pose grid into a game-ready, validated sprite sheet.

The tool only cleans, scales, aligns, packs and checks what the image already contains.
It never draws, interpolates or mirrors poses (see assets/AGENTS.md).

Usage (one action per call):
  python assets/tools/gpt_sprite_pipeline.py RAW.png --actor warrior --action idle \
      --grid 3x2 --frames 6 [--height 120] [--scale-from assets/characters/warrior/sheets/idle.json]

Outputs in assets/characters/<actor>/:
  frames/<action>/raw.png + NN.png  untouched source copy and cleaned cells
  sheets/<action>.png               horizontal strip, 192x192 RGBA cells
  sheets/<action>.json              frame size, pivot, per-frame report
  sheets/<action>-preview.png       2x preview on dark, light and mid backgrounds
  sheets/<action>-preview.gif       animated preview at game speed
and updates characters/<actor>/animations.json (status stays "draft", runtime_ready stays false).
"""
from __future__ import annotations
import argparse, json, shutil, statistics
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CELL = 192
PIVOT = (96, 172)          # feet position inside every cell
EDGE_PAD = 4               # warn when the actor gets closer than this to a cell edge


def chroma_key(im: Image.Image, key: tuple[int, int, int] | None, tol: int) -> tuple[Image.Image, tuple[int, int, int]]:
    """Make the flat generation background transparent and binarize alpha (no soft halo)."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    if key is None and all(px[x, y][3] == 0 for x, y in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))):
        # Already transparent: just binarize alpha (GPT exports leave a faint halo below 128).
        alpha = im.getchannel("A").point(lambda a: 255 if a >= 128 else 0)
        out = im.copy()
        out.putalpha(alpha)
        return out, None  # type: ignore[return-value]
    if key is None:  # sample the four corners; the prompt asks for a flat key colour
        samples = [px[x, y][:3] for x, y in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))]
        key = tuple(int(statistics.median(c[i] for c in samples)) for i in range(3))  # type: ignore[assignment]
    kr, kg, kb = key
    out = Image.new("RGBA", im.size)
    o = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            d = abs(r - kr) + abs(g - kg) + abs(b - kb)
            if a < 128 or d <= tol:
                o[x, y] = (0, 0, 0, 0)
            else:
                o[x, y] = (r, g, b, 255)
    return out, key  # type: ignore[return-value]


def drop_specks(im: Image.Image, min_pixels: int) -> int:
    """Remove isolated opaque islands smaller than min_pixels (generator noise). Returns removed count."""
    w, h = im.size
    px = im.load()
    seen = bytearray(w * h)
    removed = 0
    for sy in range(h):
        for sx in range(w):
            if seen[sy * w + sx] or px[sx, sy][3] == 0:
                continue
            stack, comp = [(sx, sy)], []
            seen[sy * w + sx] = 1
            while stack:
                x, y = stack.pop()
                comp.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and px[nx, ny][3]:
                        seen[ny * w + nx] = 1
                        stack.append((nx, ny))
            if len(comp) < min_pixels:
                for x, y in comp:
                    px[x, y] = (0, 0, 0, 0)
                removed += len(comp)
    return removed


def feet_x(im: Image.Image, box: tuple[int, int, int, int]) -> float:
    """Horizontal centre of the lowest 6% of opaque rows: the ground contact, not the sword."""
    l, t, r, b = box
    band = max(1, (b - t) * 6 // 100)
    px = im.load()
    xs = [x for y in range(b - band, b) for x in range(l, r) if px[x, y][3]]
    return sum(xs) / len(xs) if xs else (l + r) / 2


def pixelate(im: Image.Image, scale: float, colors: int) -> Image.Image:
    """Area-downscale then quantize, giving crisp pixel clusters instead of blur."""
    w, h = max(1, round(im.width * scale)), max(1, round(im.height * scale))
    small = im.resize((w, h), Image.Resampling.BOX)
    alpha = small.getchannel("A").point(lambda a: 255 if a >= 128 else 0)
    rgb = small.convert("RGB").quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("raw", type=Path)
    ap.add_argument("--actor", required=True)
    ap.add_argument("--action", required=True)
    ap.add_argument("--grid", required=True, help="COLSxROWS of the pose grid in the image, e.g. 4x2")
    ap.add_argument("--frames", type=int, help="poses to use, in reading order (default: all cells)")
    ap.add_argument("--height", type=int, default=120, help="target actor height in px for this action's tallest pose")
    ap.add_argument("--scale-from", type=Path, help="reuse the scale of an approved action JSON so all actions share one body size")
    ap.add_argument("--key", help="background key colour as hex (default: sampled from corners)")
    ap.add_argument("--tolerance", type=int, default=90)
    ap.add_argument("--colors", type=int, default=48)
    ap.add_argument("--fps", type=float, default=8)
    ap.add_argument("--loop", action="store_true")
    ap.add_argument("--impact-frame", type=int)
    ap.add_argument("--allow-neutral-key", action="store_true")
    ap.add_argument("--root", type=Path, default=ROOT, help="assets root (override only for tests)")
    args = ap.parse_args()
    root = args.root

    cols, rows = (int(v) for v in args.grid.lower().split("x"))
    count = args.frames or cols * rows
    actor_dir = root / "characters" / args.actor
    frames_dir, sheets_dir = actor_dir / "frames" / args.action, actor_dir / "sheets"
    frames_dir.mkdir(parents=True, exist_ok=True)
    sheets_dir.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(args.raw, frames_dir / "raw.png")  # keep the generation output intact

    key = tuple(int(args.key.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)) if args.key else None
    keyed, key = chroma_key(Image.open(args.raw), key, args.tolerance)  # type: ignore[arg-type]
    if key is not None and max(key) - min(key) < 80 and not args.allow_neutral_key:
        raise SystemExit(f"background key #{'%02x%02x%02x' % key} is dark/grey/white: keying it would erase outlines and shadows. Regenerate on flat #FF00FF (or pass --allow-neutral-key)")
    border = [keyed.getpixel((x, y))[3] for x in range(0, keyed.width, 4) for y in (0, keyed.height - 1)] + [keyed.getpixel((x, y))[3] for y in range(0, keyed.height, 4) for x in (0, keyed.width - 1)]
    if sum(1 for a in border if a) > len(border) * 0.05:
        raise SystemExit("background is not a flat key colour (gradient, glow or scenery reached the image border). Regenerate on flat #FF00FF; see prompts/GPT_SPRITE_GUIDE.md")
    cw, ch = keyed.width / cols, keyed.height / rows
    cells, warnings = [], []
    for i in range(count):
        c, r = i % cols, i // cols
        cell = keyed.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch)))
        specks = drop_specks(cell, max(12, int(cw * ch) // 4000))
        box = cell.getbbox()
        if not box:
            raise SystemExit(f"frame {i}: empty after background removal (check --key/--tolerance)")
        if box[0] <= 1 or box[1] <= 1 or box[2] >= cell.width - 1 or box[3] >= cell.height - 1:
            warnings.append(f"frame {i}: pose touches its grid cell edge in the source; it may be cut off or the grid is wrong")
        cells.append((cell, box, specks))

    tallest = max(b[3] - b[1] for _, b, _ in cells)
    if args.scale_from:
        scale = json.loads(args.scale_from.read_text())["sourceScale"]
    else:
        scale = args.height / tallest

    sheet = Image.new("RGBA", (CELL * count, CELL))
    report = []
    for i, (cell, box, specks) in enumerate(cells):
        fx = feet_x(cell, box)
        actor = pixelate(cell.crop(box), scale, args.colors)
        ox = round(PIVOT[0] - (fx - box[0]) * scale)
        oy = PIVOT[1] - actor.height
        frame = Image.new("RGBA", (CELL, CELL))
        frame.alpha_composite(actor, (max(-actor.width, ox), oy))
        fb = frame.getbbox() or (0, 0, 0, 0)
        clipped = ox < 0 or oy < 0 or ox + actor.width > CELL
        near_edge = fb[0] < EDGE_PAD or fb[1] < EDGE_PAD or fb[2] > CELL - EDGE_PAD
        if clipped:
            warnings.append(f"frame {i}: actor does not fit in {CELL}px cell at this scale (lower --height)")
        elif near_edge:
            warnings.append(f"frame {i}: actor within {EDGE_PAD}px of the cell edge")
        frame.save(frames_dir / f"{i:02d}.png")
        sheet.alpha_composite(frame, (i * CELL, 0))
        report.append({"frame": i, "sourceBox": box, "actorHeight": actor.height, "feetX": round(fx * scale - box[0] * scale + ox, 1), "specksRemoved": specks})

    heights = [r["actorHeight"] for r in report]
    if max(heights) - min(heights) > max(heights) * 0.10:
        warnings.append(f"actor height varies {min(heights)}-{max(heights)}px: check whether the generator changed body size between poses (fine only for crouch/jump/death)")

    sheet_path = sheets_dir / f"{args.action}.png"
    sheet.save(sheet_path)
    duration = round(1000 / args.fps)
    meta = {"actor": args.actor, "action": args.action, "texture": sheet_path.relative_to(root).as_posix(), "frameWidth": CELL, "frameHeight": CELL,
            "frames": count, "pivot": {"x": PIVOT[0] / CELL, "y": PIVOT[1] / CELL}, "durations_ms": [duration] * count, "loop": args.loop,
            "impact_frame": args.impact_frame, "sourceScale": scale, "backgroundKey": ("#%02x%02x%02x" % key) if key else "alpha", "status": "draft",
            "report": report, "warnings": warnings}
    (sheets_dir / f"{args.action}.json").write_text(json.dumps(meta, indent=2) + "\n")

    # Review images at 2x on three grounds; the GIF plays at the configured speed.
    big = [f.resize((CELL * 2, CELL * 2), Image.Resampling.NEAREST) for f in (Image.open(frames_dir / f"{i:02d}.png") for i in range(count))]
    preview = Image.new("RGBA", (CELL * 2 * count, CELL * 2 * 3))
    for row, ground in enumerate(((16, 27, 28, 255), (232, 220, 195, 255), (71, 127, 124, 255))):
        for i, f in enumerate(big):
            tile = Image.new("RGBA", f.size, ground)
            tile.alpha_composite(f)
            for x in range(0, f.width, 8):  # pivot line
                tile.putpixel((x, PIVOT[1] * 2), (215, 170, 96, 255))
            preview.paste(tile, (i * CELL * 2, row * CELL * 2))
    preview.save(sheets_dir / f"{args.action}-preview.png")
    gif = [Image.alpha_composite(Image.new("RGBA", f.size, (16, 27, 28, 255)), f).convert("P", palette=Image.Palette.ADAPTIVE) for f in big]
    gif[0].save(sheets_dir / f"{args.action}-preview.gif", save_all=True, append_images=gif[1:], duration=duration, loop=0 if args.loop else 1)

    spec_path = actor_dir / "animations.json"
    if spec_path.exists():
        spec = json.loads(spec_path.read_text())
        entry = spec.setdefault("animations", {}).setdefault(args.action, {})
        entry.update({"texture": meta["texture"], "frames": list(range(count)), "durations_ms": meta["durations_ms"], "impact_frame": args.impact_frame, "loop": args.loop})
        spec["pivot"] = meta["pivot"]
        spec["frame_size"] = [CELL, CELL]
        spec["status"] = "draft"
        spec["runtime_ready"] = False
        spec_path.write_text(json.dumps(spec, indent=2) + "\n")

    print(f"{sheet_path.relative_to(root)}: {count} frames, scale {scale:.4f}, background {meta['backgroundKey']}")
    for w in warnings:
        print("WARNING:", w)
    print("Review sheets/%s-preview.png and .gif before marking anything approved." % args.action)


if __name__ == "__main__":
    main()
