from __future__ import annotations

from pathlib import Path

from generate_mom_pdf import generate_pdf


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "deployment" / "PERSYARATAN-MIGRASI-VPS.md"
OUTPUT = ROOT / "docs" / "deployment" / "PERSYARATAN-MIGRASI-VPS.pdf"


def main() -> None:
    generate_pdf(
        SOURCE,
        OUTPUT,
        document_title="PERSYARATAN DAN PANDUAN MIGRASI KE VPS",
        document_meta=(
            "No. INF/CMD/VPS/VIII/2026/001 · Versi 1.0 · 2 Agustus 2026"
        ),
    )
    print(f"PDF dibuat: {OUTPUT}")


if __name__ == "__main__":
    main()
