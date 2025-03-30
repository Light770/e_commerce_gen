from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import time
from typing import Dict, Optional
import redis
import logging

from app.core.config import settings
from app.db.session import redis_client

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        
        # Different rate limits for different paths
        if path.startswith("/api/auth"):
            limit = settings.RATE_LIMIT_AUTH_PER_MINUTE
            window = 60  # 1 minute in seconds
        else:
            limit = settings.RATE_LIMIT_PER_MINUTE
            window = 60  # 1 minute in seconds
        
        # Create a rate limit key specific to the IP and path
        rate_limit_key = f"rate_limit:{client_ip}:{path}"
        
        # Check if rate limit is exceeded
        current_count = 0
        try:
            current_count = redis_client.get(rate_limit_key)
            if current_count is None:
                redis_client.set(rate_limit_key, 1, ex=window)
            else:
                current_count = int(current_count)
                if current_count >= limit:
                    logger.warning(f"Rate limit exceeded for IP: {client_ip}, path: {path}")
                    return HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Too many requests",
                        headers={"Retry-After": str(window)},
                    )
                
                redis_client.incr(rate_limit_key)
        except redis.RedisError as e:
            # In case of Redis failure, log and continue
            logger.error(f"Redis error in rate limiter: {e}")
        
        # Continue with the request
        response = await call_next(request)
        
        # Add rate limit headers to the response
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - ((current_count or 0) + 1)))
        response.headers["X-RateLimit-Reset"] = str(window)
        
        return response