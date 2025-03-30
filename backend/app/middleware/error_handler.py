from fastapi import Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from jose.exceptions import JWTError
import logging
import traceback

logger = logging.getLogger(__name__)

async def error_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global error handler for the application.
    Handles different types of exceptions and returns appropriate responses.
    """
    error_id = None
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail = "An unexpected error occurred"
    
    # Log the error with traceback
    logger.error(f"Error handling request: {request.url.path}")
    logger.error(f"Exception: {exc}")
    logger.error(traceback.format_exc())
    
    # Handle different types of exceptions
    if isinstance(exc, SQLAlchemyError):
        logger.error(f"Database error: {exc}")
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        detail = "A database error occurred"
    
    elif isinstance(exc, JWTError):
        logger.error(f"JWT error: {exc}")
        status_code = status.HTTP_401_UNAUTHORIZED
        detail = "Authentication error"
    
    elif hasattr(exc, "status_code"):
        # Handle FastAPI HTTPException
        status_code = exc.status_code
        detail = exc.detail if hasattr(exc, "detail") else str(exc)
    
    # Save the error to the system logs db if needed
    # This would require a service that handles system logs
    
    # Return a JSON response with the error details
    return JSONResponse(
        status_code=status_code,
        content={"detail": detail, "error_id": error_id},
    )