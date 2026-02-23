from rag_core.ingestion.pdf_loader import load_and_chunk_pdf
from rag_core.ingestion.docx_loader import load_and_chunk_docx
from rag_core.retrieval.embedder import Embedder
from rag_core.retrieval.vector_store import VectorStore


class IngestPipeline:
    """
    Orchestrates document → chunks → embeddings → FAISS.
    Accepts optional embedder and store for per-user isolation (injected by backend).
    """

    def __init__(self, embedder=None, store=None):
        self.embedder = embedder if embedder is not None else Embedder()
        self.store = store if store is not None else VectorStore()

    # --------------------------------------------

    def ingest_pdf(self, file_path: str):
        # 1️⃣ Load & chunk PDF
        chunks = load_and_chunk_pdf(file_path, chunk_size=500, overlap=100)

        # 2️⃣ Embed
        embedded_chunks = self.embedder.embed_chunks(chunks)

        # 3️⃣ Add to FAISS
        self.store.add_embeddings(
            [c["embedding"] for c in embedded_chunks],
            embedded_chunks
        )

        print(f"Ingested {len(embedded_chunks)} chunks from PDF: {file_path}")

    # --------------------------------------------

    def ingest_docx(self, file_path: str):
        # 1️⃣ Load & chunk DOCX
        chunks = load_and_chunk_docx(file_path, chunk_size=500, overlap=100)

        # 2️⃣ Embed
        embedded_chunks = self.embedder.embed_chunks(chunks)

        # 3️⃣ Add to FAISS
        self.store.add_embeddings(
            [c["embedding"] for c in embedded_chunks],
            embedded_chunks
        )

        print(f"Ingested {len(embedded_chunks)} chunks from DOCX: {file_path}")
