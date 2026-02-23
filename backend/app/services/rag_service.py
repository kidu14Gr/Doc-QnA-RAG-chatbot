"""
User-scoped RAG: per-user vector store and pipelines. No global FAISS index.
Authentication and DB stay in backend; this layer only uses user_id for paths.
"""
import logging
from uuid import UUID

from rag_core.pipeline.ingest_pipeline import IngestPipeline
from rag_core.pipeline.query_pipeline import QueryPipeline
from rag_core.retrieval.embedder import Embedder
from rag_core.retrieval.vector_store import VectorStore
from rag_core.generation.llm_model import LLMModel

from .storage_service import get_user_faiss_index_path

logger = logging.getLogger(__name__)

# Shared model instances (expensive to load)
_embedder: Embedder | None = None
_llm: LLMModel | None = None


def _get_embedder() -> Embedder:
    global _embedder
    if _embedder is None:
        _embedder = Embedder()
    return _embedder


def _get_llm() -> LLMModel:
    global _llm
    if _llm is None:
        _llm = LLMModel()
    return _llm


class RAGService:
    """Stateless: each method receives user_id and uses per-user storage."""

    def ingest_pdf(self, user_id: UUID, file_path: str) -> None:
        index_path = get_user_faiss_index_path(user_id)
        store = VectorStore(index_path=index_path)
        embedder = _get_embedder()
        pipeline = IngestPipeline(embedder=embedder, store=store)
        pipeline.ingest_pdf(file_path)
        logger.info("Ingested PDF for user %s: %s", user_id, file_path)

    def ingest_docx(self, user_id: UUID, file_path: str) -> None:
        index_path = get_user_faiss_index_path(user_id)
        store = VectorStore(index_path=index_path)
        embedder = _get_embedder()
        pipeline = IngestPipeline(embedder=embedder, store=store)
        pipeline.ingest_docx(file_path)
        logger.info("Ingested DOCX for user %s: %s", user_id, file_path)

    def query(
        self,
        user_id: UUID,
        question: str,
        top_k: int = 4,
        history: str | None = None,
    ) -> dict:
        index_path = get_user_faiss_index_path(user_id)
        store = VectorStore(index_path=index_path)
        embedder = _get_embedder()
        llm = _get_llm()
        pipeline = QueryPipeline(embedder=embedder, store=store, llm=llm)
        return pipeline.query(question, top_k=top_k, history=history)
