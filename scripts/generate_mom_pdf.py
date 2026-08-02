from __future__ import annotations

import argparse
import base64
import html
import mimetypes
import re
import shutil
import subprocess
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "docs" / "MOM.md"
DEFAULT_OUTPUT = ROOT / "docs" / "MOM.pdf"
SCHOOL_LOGO = ROOT / "public" / "logo.png"
TAHFIDZ_LOGO = ROOT / "public" / "logo-tahsin.png"


def inline_markdown(value: str) -> str:
    code_fragments: list[str] = []

    def preserve_code(match: re.Match[str]) -> str:
        code_fragments.append(f"<code>{html.escape(match.group(1))}</code>")
        return f"@@CODE{len(code_fragments) - 1}@@"

    rendered = re.sub(r"`([^`]+)`", preserve_code, value)
    rendered = html.escape(rendered)
    rendered = re.sub(
        r"\[([^\]]+)\]\(([^)]+)\)",
        lambda match: (
            f'<a href="{html.escape(match.group(2), quote=True)}">'
            f"{match.group(1)}</a>"
        ),
        rendered,
    )
    rendered = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", rendered)
    rendered = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", rendered)

    for index, fragment in enumerate(code_fragments):
        rendered = rendered.replace(f"@@CODE{index}@@", fragment)

    return rendered


def split_table_row(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def is_table_separator(line: str) -> bool:
    cells = split_table_row(line)
    return bool(cells) and all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells)


def is_block_start(lines: list[str], index: int) -> bool:
    line = lines[index]
    stripped = line.strip()
    if not stripped:
        return True
    if stripped.startswith("```"):
        return True
    if re.match(r"^#{1,6}\s+", stripped):
        return True
    if re.match(r"^[-*+]\s+", stripped) or re.match(r"^\d+\.\s+", stripped):
        return True
    if stripped in {"---", "***", "___"}:
        return True
    return (
        stripped.startswith("|")
        and index + 1 < len(lines)
        and is_table_separator(lines[index + 1])
    )


def markdown_to_html(markdown: str) -> str:
    lines = markdown.replace("\r\n", "\n").split("\n")
    blocks: list[str] = []
    index = 0

    while index < len(lines):
        stripped = lines[index].strip()
        if not stripped:
            index += 1
            continue

        if stripped.startswith("```"):
            language = stripped[3:].strip()
            index += 1
            code_lines: list[str] = []
            while index < len(lines) and not lines[index].strip().startswith("```"):
                code_lines.append(lines[index])
                index += 1
            index += 1
            language_attr = f' data-language="{html.escape(language)}"' if language else ""
            blocks.append(
                f"<pre{language_attr}><code>{html.escape(chr(10).join(code_lines))}</code></pre>"
            )
            continue

        heading = re.match(r"^(#{1,6})\s+(.+)$", stripped)
        if heading:
            level = len(heading.group(1))
            blocks.append(f"<h{level}>{inline_markdown(heading.group(2))}</h{level}>")
            index += 1
            continue

        if stripped in {"---", "***", "___"}:
            blocks.append("<hr>")
            index += 1
            continue

        if (
            stripped.startswith("|")
            and index + 1 < len(lines)
            and is_table_separator(lines[index + 1])
        ):
            headers = split_table_row(lines[index])
            index += 2
            rows: list[list[str]] = []
            while index < len(lines) and lines[index].strip().startswith("|"):
                rows.append(split_table_row(lines[index]))
                index += 1

            table = ["<table><thead><tr>"]
            table.extend(f"<th>{inline_markdown(cell)}</th>" for cell in headers)
            table.append("</tr></thead><tbody>")
            for row in rows:
                padded = row + [""] * max(0, len(headers) - len(row))
                table.append("<tr>")
                table.extend(
                    f"<td>{inline_markdown(cell)}</td>" for cell in padded[: len(headers)]
                )
                table.append("</tr>")
            table.append("</tbody></table>")
            blocks.append("".join(table))
            continue

        unordered = re.match(r"^[-*+]\s+(.+)$", stripped)
        ordered = re.match(r"^\d+\.\s+(.+)$", stripped)
        if unordered or ordered:
            tag = "ul" if unordered else "ol"
            items: list[str] = []
            pattern = r"^[-*+]\s+(.+)$" if unordered else r"^\d+\.\s+(.+)$"
            while index < len(lines):
                match = re.match(pattern, lines[index].strip())
                if not match:
                    break
                item = match.group(1)
                checked = re.match(r"^\[([ xX])\]\s+(.+)$", item)
                if checked:
                    mark = "☑" if checked.group(1).lower() == "x" else "☐"
                    item_html = (
                        f'<span class="check">{mark}</span> '
                        f"{inline_markdown(checked.group(2))}"
                    )
                else:
                    item_html = inline_markdown(item)
                items.append(f"<li>{item_html}</li>")
                index += 1
            blocks.append(f"<{tag}>{''.join(items)}</{tag}>")
            continue

        paragraph: list[str] = [stripped]
        index += 1
        while index < len(lines) and not is_block_start(lines, index):
            paragraph.append(lines[index].strip())
            index += 1
        blocks.append(f"<p>{inline_markdown(' '.join(paragraph))}</p>")

    return "\n".join(blocks)


def image_data_uri(path: Path) -> str:
    mime_type = mimetypes.guess_type(path.name)[0] or "image/png"
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


def document_html(content: str) -> str:
    school_logo = image_data_uri(SCHOOL_LOGO)
    tahfidz_logo = image_data_uri(TAHFIDZ_LOGO)
    return f"""<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>MOM — Catatan Mengaji Digital</title>
  <style>
    @page {{ size: A4; margin: 14mm 15mm 18mm; }}
    * {{ box-sizing: border-box; }}
    html {{ font-family: Arial, Helvetica, sans-serif; color: #14213d; }}
    body {{ margin: 0; font-size: 9.5pt; line-height: 1.46; }}
    h1 {{ color: #174f3a; font-size: 19pt; line-height: 1.15; margin: 13pt 0 14pt; text-align: center; text-transform: uppercase; }}
    h2 {{ color: #174f3a; font-size: 15pt; margin: 20pt 0 8pt; break-after: avoid; }}
    h3 {{ color: #1d684c; font-size: 11.5pt; margin: 14pt 0 6pt; break-after: avoid; }}
    p {{ margin: 0 0 8pt; orphans: 3; widows: 3; }}
    ul, ol {{ margin: 4pt 0 10pt 18pt; padding: 0; }}
    li {{ margin: 2.5pt 0; break-inside: avoid; }}
    table {{ width: 100%; border-collapse: collapse; margin: 7pt 0 13pt; font-size: 8.2pt; }}
    thead {{ display: table-header-group; }}
    tr {{ break-inside: avoid; }}
    th {{ background: #174f3a; color: #fff; font-weight: 700; text-align: left; }}
    th, td {{ border: 1px solid #9fb8ae; padding: 5pt 6pt; vertical-align: top; }}
    tbody tr:nth-child(even) td {{ background: #f1f7f4; }}
    code {{ font-family: Consolas, monospace; background: #edf3f0; padding: 1pt 3pt; border-radius: 2pt; font-size: 8.5pt; }}
    pre {{ background: #16251f; color: #f5fff9; padding: 9pt; border-radius: 4pt; white-space: pre-wrap; break-inside: avoid; }}
    pre code {{ background: transparent; color: inherit; padding: 0; }}
    a {{ color: #136c4b; text-decoration: none; }}
    hr {{ border: 0; border-top: 1px solid #9fb8ae; margin: 14pt 0; }}
    .check {{ color: #15835a; font-weight: 700; }}
    .letterhead {{ display: grid; grid-template-columns: 78px 1fr 78px; align-items: center; gap: 10px; padding-bottom: 7pt; border-bottom: 3px solid #173c30; position: relative; }}
    .letterhead::after {{ content: ""; position: absolute; left: 0; right: 0; bottom: -6px; border-bottom: 1px solid #173c30; }}
    .letterhead img {{ display: block; width: 70px; height: 70px; object-fit: contain; margin: auto; }}
    .letterhead .tahfidz-logo {{ width: 76px; height: 64px; border-radius: 4px; }}
    .letterhead-text {{ text-align: center; color: #102f25; line-height: 1.2; }}
    .letterhead-text .foundation {{ font-size: 9pt; font-weight: 700; letter-spacing: 0.7pt; }}
    .letterhead-text .school {{ font-size: 14.5pt; font-weight: 800; letter-spacing: 0.5pt; }}
    .letterhead-text .program {{ color: #13774f; font-size: 9.5pt; font-weight: 800; letter-spacing: 0.45pt; margin-top: 2pt; }}
    .letterhead-text .identity {{ font-size: 7.5pt; font-weight: 700; margin-top: 3pt; }}
    .letterhead-text .address {{ font-size: 6.8pt; margin-top: 2pt; }}
    .document-band {{ margin-top: 11pt; border: 1px solid #9fb8ae; background: #eff7f3; padding: 6pt 9pt; display: flex; justify-content: space-between; gap: 12pt; color: #174f3a; font-size: 8pt; }}
    .document-band strong {{ font-size: 9pt; }}
  </style>
</head>
<body>
<header class="letterhead">
  <img src="{school_logo}" alt="Logo SD Islam Labschool Bani Saleh">
  <div class="letterhead-text">
    <div class="foundation">YAYASAN BANI SALEH</div>
    <div class="school">SEKOLAH DASAR ISLAM LABSCHOOL BANI SALEH</div>
    <div class="program">CATATAN MENGAJI DIGITAL — PROGRAM TAHSIN &amp; TAHFIZH</div>
    <div class="identity">NPSN: 70010942 &nbsp;|&nbsp; TERAKREDITASI: A</div>
    <div class="address">Jl. Pangeran RT 001/008 Desa Lubang Buaya, Kec. Setu, Kab. Bekasi · sdilabschoolbanisalehsetu@gmail.com</div>
  </div>
  <img class="tahfidz-logo" src="{tahfidz_logo}" alt="Logo Tahsin dan Tahfizh">
</header>
<div class="document-band">
  <strong>MINUTES OF MEETING / NOTULEN PROYEK</strong>
  <span>No. MOM/CMD/VIII/2026/001 · Versi 2.0 · 2 Agustus 2026</span>
</div>
{content}
</body>
</html>"""


def find_chrome() -> Path:
    candidates = [
        Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
        Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate

    for command in ("chrome", "msedge", "chromium"):
        resolved = shutil.which(command)
        if resolved:
            return Path(resolved)

    raise FileNotFoundError("Google Chrome atau Microsoft Edge tidak ditemukan.")


def generate_pdf(source: Path, output: Path) -> None:
    markdown = source.read_text(encoding="utf-8")
    output.parent.mkdir(parents=True, exist_ok=True)
    chrome = find_chrome()

    with tempfile.TemporaryDirectory(prefix="mom-pdf-") as temp_directory:
        temp = Path(temp_directory)
        html_path = temp / "mom.html"
        profile_path = temp / "chrome-profile"
        html_path.write_text(
            document_html(markdown_to_html(markdown)),
            encoding="utf-8",
        )
        command = [
            str(chrome),
            "--headless=new",
            "--disable-gpu",
            "--disable-extensions",
            "--no-first-run",
            "--no-pdf-header-footer",
            f"--user-data-dir={profile_path}",
            f"--print-to-pdf={output.resolve()}",
            html_path.resolve().as_uri(),
        ]
        result = subprocess.run(command, capture_output=True, text=True, timeout=120)
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or "Chrome gagal membuat PDF.")

    if not output.exists() or output.stat().st_size == 0:
        raise RuntimeError("PDF tidak dihasilkan atau berukuran kosong.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Membuat PDF lengkap dari docs/MOM.md")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    arguments = parser.parse_args()
    generate_pdf(arguments.source.resolve(), arguments.output.resolve())
    print(f"PDF dibuat: {arguments.output.resolve()}")


if __name__ == "__main__":
    main()
