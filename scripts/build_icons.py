#!/usr/bin/env python3
"""Build icons/slo-icons.svg (a <symbol> sprite) from the individual icons/*.svg files.

Each source icon is a 24x24, stroke-only SVG that draws in `currentColor`.
Stroke width, size and colour are set by CSS (see style/icons.css), so the
sources carry only geometry. Run after adding or editing an icon:

    python3 scripts/build_icons.py
"""
import re
import sys
from pathlib import Path

ICON_DIR = Path(__file__).resolve().parent.parent / "icons"
SPRITE = ICON_DIR / "slo-icons.svg"
INNER = re.compile(r"<svg[^>]*>(.*)</svg>", re.S)


def build():
    sources = sorted(p for p in ICON_DIR.glob("*.svg") if p != SPRITE)
    if not sources:
        sys.exit("no icons found in " + str(ICON_DIR))

    symbols = []
    for path in sources:
        match = INNER.search(path.read_text())
        if not match:
            sys.exit(f"{path.name}: not a valid <svg> file")
        symbols.append(f'  <symbol id="{path.stem}" viewBox="0 0 24 24">{match.group(1).strip()}</symbol>')

    SPRITE.write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n'
        + "\n".join(symbols)
        + "\n</svg>\n"
    )
    print(f"wrote {SPRITE.name} with {len(symbols)} icons")


if __name__ == "__main__":
    build()
