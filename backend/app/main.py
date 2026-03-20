"""
AI-DOC-RAG Backend: SaaS-ready multi-user API.
Clean separation: auth and DB in backend; RAG logic in rag_core.
"""
import logging
import os
import uuid
from contextlib import asynccontextmanager
from time import perf_counter

try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
except ImportError:
    pass  # Env set by Docker or shell

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from .auth import router as auth_router
from .core.metrics import metrics_response, track_request
from .core.rate_limit import rate_limiter
from .db import init_db
from .routers import chat_router, query_router, upload_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("Database tables initialized")
    yield
    # Shutdown if needed
    pass


app = FastAPI(
    title="AI Docs RAG Backend",
    description="Multi-user document RAG with auth and per-user storage",
    lifespan=lifespan,
)

origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # sometimes used by CRA/spa
    # maybe add other hosts as needed; you can also set allow_origins=["*"]
    # in production if you genuinely have a public API and are careful with
    # credentials (allow_credentials=True). For now we explicitly list
    # dev hosts.
]

# CORS: c origin(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def request_observability_and_limits(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    path = request.url.path
    client_ip = request.client.host if request.client else "unknown"

    # Global + tighter auth limits.
    global_key = f"global:{client_ip}"
    auth_key = f"auth:{client_ip}"
    if not rate_limiter.allow(global_key, limit=240, window_seconds=60):
        return JSONResponse(status_code=429, content={"detail": "Too many requests. Please slow down."})
    if path.startswith("/auth/") and not rate_limiter.allow(auth_key, limit=30, window_seconds=60):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many authentication attempts. Please try again later."},
        )

    started = perf_counter()
    response: Response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    track_request(request.method, path, response.status_code, started)
    logger.info(
        "request_complete",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": path,
            "status": response.status_code,
            "client_ip": client_ip,
            "elapsed_ms": round((perf_counter() - started) * 1000, 2),
        },
    )
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error: %s", exc)
    # CORS middleware normally adds headers, but some errors may slip
    # through and the frontend ends up with a missing header error. Add a
    # permissive header here so that the client always sees something even
    # if the error originated early in the request lifecycle.
    headers = {"Access-Control-Allow-Origin": "*"}
    if request.headers.get("origin"):
        headers["Access-Control-Allow-Origin"] = request.headers.get("origin")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
        headers=headers,
    )


app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(query_router)
app.include_router(chat_router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/metrics")
def metrics():
    return metrics_response()
