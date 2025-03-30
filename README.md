# Full Stack Application

This document provides instructions on how to configure and start the full-stack application for development.

## Prerequisites

Before you begin, ensure you have the following installed:

*   [Docker](https://www.docker.com/get-started)
*   [Docker Compose](https://docs.docker.com/compose/install/)
*   [Node.js](https://nodejs.org/) (v16 or higher)
*   [npm](https://www.npmjs.com/) (v7 or higher)

## Configuration

1.  **Environment Variables:**

    Create a `.env` file in the root directory of the project. You can use the `.env.example` file as a template.

    ```bash
    cp .env.example .env
    ```

    Modify the `.env` file with your specific configuration values.

    Example `.env` file:

    ```
    DATABASE_URL=postgresql://user:password@host:port/database
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    REFRESH_TOKEN_EXPIRE_DAYS=7
    CORS_ORIGINS=http://localhost:3000
    NEXT_PUBLIC_API_URL=http://localhost:8000
    ```

## Setup

1.  **Database Setup:**

    The application uses PostgreSQL as its database. You can set up the database using Docker Compose.

    ```bash
    docker-compose up -d
    ```

    This command will start the PostgreSQL database in a Docker container.

2.  **Backend Setup:**

    Navigate to the `backend` directory:

    ```bash
    cd backend
    ```

    Install the backend dependencies:

    ```bash
    pip install -r requirements.txt
    ```

    Run the database migrations:

    ```bash
    alembic upgrade head
    ```

    Initialize the database (create admin user):

    ```bash
    python init_db.py
    ```

3.  **Frontend Setup:**

    Navigate to the `frontend` directory:

    ```bash
    cd frontend
    ```

    Install the frontend dependencies:

    ```bash
    npm install
    ```

## Running the Application

1.  **Backend:**

    Navigate to the `backend` directory:

    ```bash
    cd backend
    ```

    Run the backend application using uvicorn:

    ```bash
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```

2.  **Frontend:**

    Navigate to the `frontend` directory:

    ```bash
    cd frontend
    ```

    Start the frontend development server:

    ```bash
    npm run dev
    ```

    This will start the frontend application on `http://localhost:3000`.

## Notes

*   Ensure that the database is running before starting the backend application.
*   The backend application will automatically reload when you make changes to the code.
*   The frontend application will automatically reload when you make changes to the code.