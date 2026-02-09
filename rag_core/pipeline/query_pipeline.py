from rag_core.retrieval.embedder import Embedder
from rag_core.retrieval.vector_store import VectorStore
from rag_core.generation.llm_model import LLMModel
from rag_core.generation.prompt_templates import build_rag_prompt

class QueryPipeline:
    """
    Question → embed → retrieve → prompt → LLM answer
    """

    def __init__(self):
        self.embedder = Embedder()
        self.store = VectorStore()
        self.llm = LLMModel()

    def query(self, question: str, top_k: int = 4):
        # 0️⃣ Classify intent
        intent = self.llm.classify_intent(question)

        # If no document has been ingested and question is document-related
        if intent == "DOCUMENT" and (self.store.index is None or not self.store.metadata):
            return {
                "answer": "Please upload your document first.",
                "sources": []
            }

        # General questions should bypass retrieval
        if intent == "GENERAL":
            return {
                "answer": self.llm.generate_general(question),
                "sources": []
            }

        # 1️⃣ Embed the question
        question_vector = self.embedder.embed_text(question)

        # 2️⃣ Retrieve relevant chunks
        results = self.store.search(question_vector, top_k=top_k)

        # 3️⃣ Aggregate context
        context = "\n\n".join([r["text"] for r in results])

        # 4️⃣ Build RAG prompt
        prompt = build_rag_prompt(question, context)

        # 5️⃣ Generate answer
        answer = self.llm.generate(prompt)

        return {
            "answer": answer,
            "sources": results
        }
