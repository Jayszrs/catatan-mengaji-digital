from __future__ import annotations

from pathlib import Path

from generate_mom_pdf import generate_pdf


ROOT = Path(__file__).resolve().parents[1]
GUIDE_DIR = ROOT / "docs" / "panduan"

GUIDES = (
    {
        "slug": "ADMIN",
        "title": "PANDUAN OPERASIONAL ROLE ADMIN",
        "meta": "No. PND/CMD/ADM/VIII/2026/002 · Versi 2.0 · 2 Agustus 2026",
    },
    {
        "slug": "GURU",
        "title": "PANDUAN OPERASIONAL ROLE GURU",
        "meta": "No. PND/CMD/GRU/VIII/2026/001 · Versi 1.0 · 2 Agustus 2026",
    },
    {
        "slug": "ORANG-TUA",
        "title": "PANDUAN OPERASIONAL ROLE ORANG TUA/WALI",
        "meta": "No. PND/CMD/ORT/VIII/2026/001 · Versi 1.0 · 2 Agustus 2026",
    },
)


def main() -> None:
    for guide in GUIDES:
        source = GUIDE_DIR / f"PANDUAN-ALUR-{guide['slug']}.md"
        output = GUIDE_DIR / f"PANDUAN-ALUR-{guide['slug']}.pdf"
        generate_pdf(
            source,
            output,
            document_title=guide["title"],
            document_meta=guide["meta"],
        )
        print(f"PDF dibuat: {output}")


if __name__ == "__main__":
    main()
