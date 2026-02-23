# AI Document RAG Chatbot

Professional RAG system (SaaS-ready multi-user):
- Multi-user authentication (JWT)
- Per-user document storage and vector isolation (FAISS)
- Chat history persistence (PostgreSQL)
- Docker Compose (backend + PostgreSQL)
- Free & open source stack

## Running with Docker (multi-user backend)

1. Copy `.env.example` to `.env` and set at least:
   - `POSTGRES_PASSWORD`
   - `JWT_SECRET_KEY` (long random string)
   - `GROQ_API_KEY`, `HF_TOKEN` (for RAG)
2. From project root: `docker compose up --build`
3. Backend: http://localhost:8000 — API docs: http://localhost:8000/docs  
   Auth: `POST /auth/signup`, `POST /auth/login`. Use `Authorization: Bearer <token>` for `/upload/pdf`, `/upload/docx`, `/query`.  
   Public: `POST /chat/general`, `GET /health`.

## Backend layout (multi-user)

- `backend/app/auth/` — JWT signup/login, `get_current_user`
- `backend/app/db/` — SQLAlchemy session, `init_db`; `models/` User, Document, ChatHistory
- `backend/app/routers/` — upload (protected), query (protected), chat/general (public)
- `backend/app/services/` — RAG (per-user vector store), storage paths, chat persistence
- `backend/app/core/config.py` — settings from env
- `rag_core/` — pure RAG logic (unchanged)


| File                    | Purpose                                                    |
| ----------------------- | ----------------------------------------------------------     |
| `pdf_loader.py`           | Load PDF files and extract text                            |
| `docx_loader.py`          | Load DOCX files and extract text                           |
| `utils.py` (ingestion)  | Chunking, cleaning, preprocessing text                     |
| `embedder.py`           | Convert text chunks → embeddings using `all-mpnet-base-v2` |
| `vector_store.py`       | Store embeddings in FAISS, query similarity                |
| `utils.py` (retrieval)  | Search helpers, filtering by metadata (page/file)          |
| `llm_model.py`          | Load CPU-friendly LLM, generate answers from context       |
| `prompt_templates.py`   | Store prompts for Q&A, summarization, citations            |
| `utils.py` (generation) | Format answers, attach page/file citations                 |
