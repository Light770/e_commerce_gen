from sqlalchemy import inspect, text
import logging
import os
import subprocess
from app.db.session import engine, SessionLocal
from app.db.base_class import Base
from app.models import models

logger = logging.getLogger(__name__)

async def init_db() -> None:
    """Initialize database tables and apply migrations if necessary."""
    try:
        # Check if database exists and has tables
        inspector = inspect(engine)
        has_tables = inspector.get_table_names()
        
        if not has_tables:
            logger.info("Database is empty, creating initial structure")
            # Create all tables
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables created successfully")
            
            # Initialize with default data
            await initialize_default_data()
        else:
            logger.info("Database already has tables, checking for migrations")
            # Apply any pending migrations
            apply_migrations()
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise

async def initialize_default_data():
    """Initialize database with default data."""
    db = SessionLocal()
    try:
        # Check if roles table has data
        result = db.execute(text("SELECT COUNT(*) FROM roles")).scalar()
        
        if result == 0:
            logger.info("Initializing default roles")
            db.execute(text("""
                INSERT INTO roles (name, description) 
                VALUES ('admin', 'Administrator with full access'),
                       ('user', 'Regular user with limited access')
            """))
            db.commit()
        
        # Check if tools table has data
        result = db.execute(text("SELECT COUNT(*) FROM tools")).scalar()
        
        if result == 0:
            logger.info("Initializing default tools")
            db.execute(text("""
                INSERT INTO tools (name, description, icon, is_active) 
                VALUES ('Data Analyzer', 'Analyze and visualize your data', 'chart-bar', 1),
                       ('Text Processor', 'Process and transform text content', 'file-text', 1),
                       ('Image Editor', 'Edit and optimize images', 'image', 1)
            """))
            db.commit()
        
    except Exception as e:
        logger.error(f"Error initializing default data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def apply_migrations():
    """Apply any pending Alembic migrations."""
    try:
        alembic_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "alembic")
        if os.path.exists(alembic_dir):
            logger.info("Applying database migrations")
            # Run alembic upgrade
            subprocess.run(["alembic", "upgrade", "head"], check=True)
            logger.info("Database migrations applied successfully")
        else:
            logger.warning("Alembic directory not found, skipping migrations")
    except Exception as e:
        logger.error(f"Error applying migrations: {e}")
        raise