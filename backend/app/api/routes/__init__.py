from fastapi import APIRouter
from app.api.routes import auth, users, tools, admin

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(tools.router, prefix="/tools", tags=["Tools"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])