Generic single-database configuration with an SQLAlchemy backend.

This directory contains the Alembic migrations for the database.

To generate a new migration:
alembic revision --autogenerate -m "description of the migration"

To apply migrations:
alembic upgrade head