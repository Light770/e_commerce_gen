from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
from typing import List
import logging
import os

from app.core.config import settings
from app.core.init_db import init_db
from app.api.routes import api_router
from app.middleware.rate_limiter import RateLimitMiddleware
from app.middleware.error_handler import error_handler
from app.core.security import create_admin_user

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Full Stack Application API",
    description="API for the full stack application with FastAPI backend",
    version="1.0.0",
)

# # Read CORS origins from environment variable
# CORS_ORIGINS_STR = os.getenv("CORS_ORIGINS", "http://localhost:3000")
# CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS_STR.split(",")]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# Include all API routes
app.include_router(api_router, prefix="")

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return await error_handler(request, exc)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up the application")
    await init_db()
    await create_admin_user()

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down the application")

@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}

# This will be the main entrypoint for Gunicorn in production
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)