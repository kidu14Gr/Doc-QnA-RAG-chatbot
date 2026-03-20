# 🤖 AI Document RAG Chatbot

<p align="left">
  <img alt="Python" src="https://img.shields.io/badge/Python-3.12-blue?logo=python" />
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi" />
  <img alt="React" src="https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=000" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-UI-3178C6?logo=typescript&logoColor=fff" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=fff" />
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=fff" />
  <img alt="FAISS" src="https://img.shields.io/badge/Vector%20Store-FAISS-5B3CC4" />
</p>

AI-powered question-answering chatbot built with a **responsive React frontend**, a **FastAPI backend**, **PostgreSQL**, and **FAISS**.  
It supports both **guest chat** and **authenticated document-grounded chat** with persistent history.

## 🎬 Demo



![AI Doc RAG Demo](frontend/public/screenshots/demo.gif)

### 🧭 What Users Can Do

- chat freely as a guest,
- sign in to upload PDF/DOCX files,
- ask document-grounded questions with retrieval,
- continue conversations with persistent chat history.


- **JWT multi-user support** with per-user vector isolation and storage.

- **Docker Compose ready**: backend + database (and optionally static frontend files) in one command.
- **RAG pipeline** using CPU‑friendly LLMs for retrieval‑augmented generation.

---

## ✨ Key Features
- **Responsive frontend** with React, TypeScript, Vite and Tailwind CSS.
- **Backend API** using FastAPI for ingestion, querying, authentication, and chat history.
- **Vector retrieval** powered by FAISS embeddings.
- **Persistent chat logs** stored in PostgreSQL via SQLAlchemy.
- 🔐 **JWT authentication** with per-user isolation
- 📄 **Document upload** (PDF/DOCX) directly from chat input
- 🧠 **RAG pipeline** (ingest, embed, retrieve, answer)
- 🗂️ **Per-user vector indexes** with model-safe FAISS index naming
- 💬 **Chat sessions sidebar** (`New Chat +`, session switching, persisted history)
- ⏱️ **Prompt limit per chat** with remaining-counter UX
- 🐳 **Docker Compose ready** for fast local deployment

## 🧰 Technologies

### 🎨 Frontend
- **React 18** for dynamic, component-based UI
- **TypeScript** for type-safe, maintainable code
- **Vite** for fast local dev and optimized production builds
- **Tailwind CSS** for modern responsive styling
- **Lucide React** for clean iconography

### ⚙️ Backend
- **FastAPI** for high-performance async APIs
- **Pydantic** for robust request/response validation
- **SQLAlchemy** for ORM-based data access
- **Uvicorn** as the ASGI server runtime
- **python-jose + passlib/bcrypt** for JWT and password security

### 🧠 AI / RAG
- **Groq API** for fast LLM inference
- **Sentence-Transformers** (`all-MiniLM-L6-v2`) for embeddings
- **FAISS** for vector indexing and similarity search
- **Custom `rag_core` pipelines** for ingestion, retrieval, and generation

### 🗄️ Data & Persistence
- **PostgreSQL** for users, chat sessions, and message history
- **Per-user file storage** for uploaded documents
- **Per-user FAISS indexes** with model-safe index naming

### 🚀 DevOps, Quality & Hardening
- **Docker + Docker Compose** for reproducible environments
- **GitHub Actions** CI for backend/frontend quality checks
- **Alembic** for schema migration lifecycle
- **Prometheus metrics** endpoint (`/metrics`) for monitoring
- **Rate limiting + request IDs** for reliability and observability

---

## 🏗️ Architecture Overview

```mermaid
flowchart LR
    FE[Frontend: React + Vite + Tailwind]
    API[Backend: FastAPI]
    AUTH[Auth: JWT]
    CHAT[Chat + Session Service]
    RAG[RAG Core]
    EMB[Embedding Model]
    VS[(FAISS Vector Store)]
    DB[(PostgreSQL)]
    FS[(User File Storage)]
    LLM[Groq LLM API]

    FE -->|HTTP| API
    API --> AUTH
    API --> CHAT
    API --> RAG
    CHAT --> DB
    RAG --> EMB
    RAG --> VS
    RAG --> LLM
    API --> FS
    API --> DB
```

- Frontend in `frontend/` handles uploads, chat UI and user interactions.
- Backend in `backend/app/` exposes `/upload`, `/query`, `/chat`, `/auth` routes.
- Data layer: PostgreSQL for users/chat, filesystem for documents, FAISS for embeddings.
- Core RAG code lives in `rag_core/` and is framework-agnostic.

## 🖼️ Project Preview

> Screenshots are loaded from `frontend/public/screenshots` and linked with URL-encoded paths for GitHub compatibility.

![Project Screenshot 1](frontend/public/screenshots/Screenshot%201.png)
![Project Screenshot 2](frontend/public/screenshots/Screenshot%202.png)
![Project Screenshot 3](frontend/public/screenshots/Screenshot%203.png)
![Project Screenshot 4](frontend/public/screenshots/Screenshot%204.png)
![Project Screenshot 5](frontend/public/screenshots/Screenshot%205.png)

---

## 🧩 Backend API Overview

- `POST /auth/signup` – create account
- `POST /auth/login` – login and receive token
- `GET /auth/me` – authenticated user info
- `POST /upload/pdf` – upload and ingest PDF
- `POST /upload/docx` – upload and ingest DOCX
- `POST /query` – authenticated RAG query (`chat_id` supported)
- `POST /chat/general` – guest/general chat
- `GET /chat/sessions` – list user chat sessions
- `POST /chat/sessions` – create new chat session
- `GET /chat/sessions/{session_id}/messages` – fetch session messages

Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## ⚙️ Environment Variables

Create `.env` with at least:

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- `GROQ_API_KEY`, `GROQ_MODEL`
- `HF_TOKEN` (if needed for model pulls)
- `EMBEDDING_MODEL` (default: `sentence-transformers/all-MiniLM-L6-v2`)

---

## 🚀 Quick Start (Docker)

```bash
docker compose up -d --build
```

Services:

- Backend: [http://localhost:8000](http://localhost:8000)
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Adminer: [http://localhost:8080](http://localhost:8080)

---

## 💻 Local Development (Without Docker)

### Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```text
backend/
  app/
    auth/            # auth routes, jwt deps, password utils
    core/            # config/settings
    db/              # SQLAlchemy engine/session/init
    models/          # User, Document, ChatSession, ChatHistory
    routers/         # auth, upload, query, chat
    services/        # rag service, chat service, storage service
    schemas/         # request/response models

rag_core/
  generation/        # prompts + LLM wrapper
  ingestion/         # PDF/DOCX loaders and chunking
  pipeline/          # ingest/query orchestration
  retrieval/         # embedder + FAISS vector store

frontend/
  src/
    components/      # UI sections (chat, auth, header)
    lib/             # API client
    styles/          # Tailwind styles
  public/screenshots # README preview images
```

---

## 🛡️ Production-Readiness Notes

- ✅ Authenticated routes protect user-specific resources.
- ✅ User data isolation for documents, vectors, and chat history.
- ✅ Session-based chat history persisted in PostgreSQL.
- ✅ Dockerized deployment with persistent DB/storage volumes.
- ✅ Improved upload/cancel UX and robust error handling.
- ✅ CI pipeline for backend/frontend checks and Docker build smoke test.
- ✅ Alembic migration scaffold added for schema evolution.
- ✅ Observability basics: request metrics and request-ID tracking.
- ✅ Security hardening: rate limiting and refresh-token endpoint.

### CI/CD

- Workflow file: `.github/workflows/ci-cd.yml`
- Runs on PR/push/manual:
  - backend dependency install + compile checks,
  - frontend install + TypeScript check + production build,
  - backend Docker image build smoke test.

### Migrations (Alembic)

- Config: `alembic.ini`
- Environment: `alembic/env.py`
- Initial revision: `alembic/versions/0001_initial_schema.py`

```

### Observability and Security Additions

- `GET /metrics` endpoint for Prometheus scraping.
- Request-ID response header (`X-Request-ID`) and request timing logs.
- In-memory rate limiting middleware:
  - global per-IP cap,
  - stricter cap for `/auth/*` routes.
- Refresh-token flow:
  - `/auth/login` and `/auth/signup` return `refresh_token`,
  - `/auth/refresh` rotates access + refresh tokens.

