import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .middleware.logging import RequestLoggingMiddleware
from .middleware.rate_limit import RateLimitMiddleware
from .routes.auth import router as auth_router
from .routes.eligibility import router as eligibility_router
from .routes.schemes import router as schemes_router
from .routes.feedback import router as feedback_router
from .routes.admin import router as admin_router
from .routes.ocr import router as ocr_router
from .schemas.common import HealthResponse
from .services.database import mongo_manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await mongo_manager.connect()
        if mongo_manager.is_connected:
            from .services.auth_service import seed_demo_users
            await seed_demo_users()
    except Exception:
        logging.exception("MongoDB connection failed; continuing without persistence")
    yield
    await mongo_manager.close()


settings = get_settings()

app = FastAPI(
    title="JanSathi AI API",
    description="Government scheme discovery API with deterministic eligibility matching.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
app.add_middleware(RateLimitMiddleware, requests_per_minute=settings.rate_limit_per_minute)
app.add_middleware(RequestLoggingMiddleware)

api_prefix = "/api/v1"
app.include_router(auth_router, prefix=api_prefix)
app.include_router(eligibility_router, prefix=api_prefix)
app.include_router(schemes_router, prefix=api_prefix)
app.include_router(feedback_router, prefix=api_prefix)
app.include_router(admin_router, prefix=api_prefix)
app.include_router(ocr_router, prefix=api_prefix)



@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        environment=settings.app_env,
        mongodb="connected" if mongo_manager.is_connected else "disabled",
    )
