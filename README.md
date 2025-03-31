# Full Stack Application

This document provides instructions on how to configure and start the full-stack application for development.

## Prerequisites

Before you begin, ensure you have the following installed:

*   [Docker](https://www.docker.com/get-started)
*   [Docker Compose](https://docs.docker.com/compose/install/)
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [npm](https://www.npmjs.com/) (v10 or higher)

## Configuration

1.  **Environment Variables:**

    Create a `.env` file in the root directory of the project. You can use the `.env.example` file as a template.

    Modify the `.env` file with your specific configuration values.

## Setup

1.  **Frontend Setup:**

    Activate the frontend first to create the missing package-lock.json or else docker-compose up -d --build won't work.

    Navigate to the `frontend` directory:

    ```bash
    cd frontend
    ```

    Install the frontend dependencies:

    ```bash
    npm install
    ```

    Go back to root directory :

    ```bash
    cd ..
    ```

2.  **Database Setup:**

    The application uses MariaDB as its database. You can set up the database using Docker Compose.

    ```bash
    docker-compose up -d --build
    ```

    This command will start the MariaDB database in a Docker container.

3.  **Check the pages**

    check health via the logs :

    ```bash
    docker compose logs
    ```

    Check the frontend on http://localhost:3000

    you can log in using admin account from the .env file:
    ```bash
    ADMIN_EMAIL=admin@example.com
    ADMIN_PASSWORD=admin-password-change-me
    ```

    Check the health of the api :

    http://localhost:3000/api/health

    Check the enpoints for the api :

    http://localhost:8000/docs

    Check the database :

    http://localhost:8080

    to log using root account check the env file, default is :
    ```bash
    USER=root
    MYSQL_ROOT_PASSWORD=secure-root-password
    ```

## Running the Application without docker (not recommended)

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

## Setting up emails on the registrar front

    A. Setting up SPF Records
    The Sender Policy Framework (SPF) record specifies which mail servers are authorized to send email from your domain.

    Log in to your domain registrar's control panel (GoDaddy, Namecheap, etc.)
    Navigate to the DNS management section
    Add a TXT record with:

    Host: @ or leave empty (depends on registrar)
    Value: v=spf1 include:_spf.your-email-provider.com ~all

    For example, with SendGrid: v=spf1 include:sendgrid.net ~all

    B. Setting up DKIM Records
    DomainKeys Identified Mail (DKIM) adds a digital signature to verify email authenticity.

    In your email provider's dashboard, generate DKIM keys
    In your registrar's DNS settings, add a TXT record:

    Host: typically something like mail._domainkey (provider will specify)
    Value: the DKIM key provided by your email service (often a long string)



    C. Setting up DMARC Records
    Domain-based Message Authentication, Reporting & Conformance protects your domain from email spoofing.

    Add a TXT record:

    Host: _dmarc
    Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com



    D. Optional: Setting up MX Records
    If you're also receiving emails, add MX records:

    Add MX record(s):

    Host: @ or leave empty
    Priority: As specified by your email provider (e.g., 10)
    Value: The mail server address (e.g., mail.yourdomain.com)