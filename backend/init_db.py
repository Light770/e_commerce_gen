import asyncio
import logging
import sys
from app.core.init_db import init_db
from app.core.security import create_admin_user

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    logger.info("Initializing database")
    try:
        # Initialize database tables or run migrations
        await init_db()
        
        # Create admin user
        await create_admin_user()
        
        logger.info("Database initialization completed successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())