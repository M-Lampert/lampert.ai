#!/usr/bin/env python3
"""Optimize the images in ``images/`` for the web.

Downscales oversized images to a sensible bounding box, re-compresses them, and
(for the images rendered on a page) writes a sibling ``.webp``. Re-runnable and
idempotent-ish: it overwrites the originals with smaller versions, so commit the
results and only re-run when you add/replace a source image.

Usage (no system install needed):

    uv run --with pillow python scripts/optimize_images.py
"""

from __future__ import annotations

import os
from pathlib import Path

from PIL import Image

IMAGES = Path(__file__).resolve().parent.parent / "images"

# filename -> (bounding box (w, h), JPEG/WebP quality). Images are downscaled to
# *fit* (aspect kept); never upscaled. Boxes are ~2x the largest on-page display
# size for retina.
#
# NOTE: the banner background is shown *sharp* on the home page (banner_blurred:
# false) and only blurred on the other pages, so it is kept large and at high
# quality to stay crisp full-width on the home page.
TARGETS: dict[str, tuple[tuple[int, int], int]] = {
    "background.jpg": ((2560, 2560), 88),  # banner bg; SHARP on the home page
    "moritz.png": ((1200, 1200), 82),  # Open Graph image only (not rendered on-page)
    "moritz_small.png": ((400, 400), 82),  # About portrait (~150px)
    "cell_type_graph.png": ((700, 700), 82),  # Home figure (~200px tall)
    "temporal_graph.png": ((700, 700), 82),  # Home figure (~200px tall)
    "ML4Nets_logo.png": ((400, 400), 82),  # Affiliation logo
    "CAIDAS_logo.png": ((400, 400), 82),  # Affiliation logo
    "JMU_logo.png": ((400, 400), 82),  # Affiliation logo
    "pathpy_logo_new.png": ((800, 800), 82),  # PathpyG banner image
}

# The OG image is fetched only by social scrapers (some lack WebP) -> no .webp.
NO_WEBP = {"moritz.png"}


def optimize(path: Path, box: tuple[int, int], quality: int) -> None:
    before = path.stat().st_size
    img = Image.open(path)
    orig = img.size
    img.thumbnail(box, Image.LANCZOS)

    # Re-encode to a temp file first; only replace the original if we actually
    # made it smaller (Pillow's lossless PNG encoder can be worse than whatever
    # produced the committed file — never regress).
    tmp = path.with_name(path.name + ".tmp")
    if path.suffix.lower() in {".jpg", ".jpeg"}:
        img.convert("RGB").save(
            tmp, "JPEG", quality=quality, optimize=True, progressive=True
        )
    else:  # PNG: keep alpha; Pillow's optimize is lossless.
        img.save(tmp, "PNG", optimize=True)

    new = tmp.stat().st_size
    if new < before:
        os.replace(tmp, path)
        note = ""
    else:
        tmp.unlink()
        note = "  (kept original — re-encode was not smaller)"
    print(f"  {path.name:24} {orig} -> {img.size}   {before // 1024}K -> {path.stat().st_size // 1024}K{note}")

    # WebP is generated from the downscaled image and is what modern browsers
    # actually fetch, so always (re)write it.
    if path.name not in NO_WEBP:
        webp = path.with_suffix(".webp")
        img.save(webp, "WEBP", quality=quality, method=6)
        print(f"  {webp.name:24} {' ' * 24} {webp.stat().st_size // 1024}K (webp)")


def main() -> None:
    print(f"Optimizing images in {IMAGES}")
    for name, (box, quality) in TARGETS.items():
        path = IMAGES / name
        if path.exists():
            optimize(path, box, quality)
        else:
            print(f"  {name}: MISSING (skipped)")


if __name__ == "__main__":
    main()
