from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET
from .utils import chunk_text


def load_docx(file_path: str):
    """
    Minimal DOCX text extractor without external dependencies.
    Treats the whole document as a single 'page' for downstream chunking.
    """
    doc_path = Path(file_path)
    if not doc_path.exists():
        raise FileNotFoundError(f"{file_path} not found")

    with ZipFile(doc_path) as zf:
        with zf.open("word/document.xml") as xml_file:
            tree = ET.parse(xml_file)

    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    paragraphs = []
    for p in tree.iterfind(".//w:p", ns):
        texts = [t.text for t in p.iterfind(".//w:t", ns) if t.text]
        if texts:
            paragraphs.append("".join(texts))

    full_text = "\n\n".join(paragraphs)

    return [{"page_number": 1, "text": full_text}]


def load_and_chunk_docx(file_path: str, chunk_size: int = 500, overlap: int = 100):
    pages = load_docx(file_path)
    return chunk_text(pages, chunk_size=chunk_size, overlap=overlap)
