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


def load_existing_captions() -> tuple[dict[str, str], dict[str, str]]:
    by_name: dict[str, str] = {}
    by_stem: dict[str, str] = {}
    if not MANIFEST.is_file():
        return by_name, by_stem

    try:
        data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return by_name, by_stem

    photos = data if isinstance(data, list) else data.get("photos", [])
    for entry in photos:
        if isinstance(entry, str):
            by_name[entry] = ""
            by_stem[Path(entry).stem] = ""
        elif isinstance(entry, dict) and entry.get("file"):
            caption = str(entry.get("caption") or "")
            filename = entry["file"]
            by_name[filename] = caption
            by_stem[Path(filename).stem] = caption
    return by_name, by_stem


def main() -> None:
    if not PHOTO_DIR.is_dir():
        raise SystemExit(f"Photo folder not found: {PHOTO_DIR}")

    by_name, by_stem = load_existing_captions()
    files = sorted(
        path.name
        for path in PHOTO_DIR.iterdir()
        if path.is_file() and path.suffix.lower() in EXTENSIONS
    )

    photos = [
        {
            "file": name,
            "caption": by_name.get(name) or by_stem.get(Path(name).stem, ""),
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
