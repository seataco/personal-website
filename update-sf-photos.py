"""Regenerate images/sf-photos.json from the files in images/sf png.

Preserves existing per-photo captions when files are added or removed.

Run from the Personal Website folder:
  python update-sf-photos.py
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PHOTO_DIR = ROOT / "images" / "sf png"
MANIFEST = ROOT / "images" / "sf-photos.json"
EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}


def load_existing_captions() -> dict[str, str]:
    if not MANIFEST.is_file():
        return {}

    try:
        data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}

    photos = data if isinstance(data, list) else data.get("photos", [])
    captions: dict[str, str] = {}

    for entry in photos:
        if isinstance(entry, str):
            captions[entry] = ""
        elif isinstance(entry, dict) and entry.get("file"):
            captions[entry["file"]] = str(entry.get("caption") or "")

    return captions


def main() -> None:
    if not PHOTO_DIR.is_dir():
        raise SystemExit(f"Photo folder not found: {PHOTO_DIR}")

    existing = load_existing_captions()
    files = sorted(
        path.name
        for path in PHOTO_DIR.iterdir()
        if path.is_file() and path.suffix.lower() in EXTENSIONS
    )

    photos = [
        {
            "file": name,
            "caption": existing.get(name, ""),
        }
        for name in files
    ]

    manifest = {
        "directory": "images/sf png",
        "photos": photos,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    captioned = sum(1 for photo in photos if photo["caption"].strip())
    print(f"Wrote {len(photos)} photo(s) to {MANIFEST.relative_to(ROOT)}")
    print(f"{captioned} caption(s) preserved or present")


if __name__ == "__main__":
    main()
