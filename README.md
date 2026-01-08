# Web Application Security - Lab 10

This project is a Python/FastAPI implementation of the "Web Application Security" Lab 10 assignment. It replicates the architecture of a Spring Boot application using the `FastAPI`, `SQLAlchemy`, and `Alembic` stack.

## Tech Stack

- **Language:** Python 3.10+
- **Framework:** FastAPI
- **Database:** SQLite
- **ORM:** SQLAlchemy
- **Migrations:** Alembic
- **Utilities:** Pydantic, python-dotenv

## Setup Instructions

### 1. Prerequisites
Ensure you have Python 3.10 or higher installed.

### 2. Installation

1.  **Clone the repository** (if you haven't already).
2.  **Create a virtual environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

### 3. Configuration

1.  Create a `.env` file in the root directory.
2.  Copy the contents from `.env.example`:
    ```bash
    cp .env.example .env
    ```
3.  Ensure `DATABASE_URL` is set (default is `sqlite:///./app.db`).

### 4. Database Initialization

Run the database migrations to create the schema:

```bash
alembic upgrade head
```

### 5. Running the Application

Start the development server:

```bash
uvicorn main:app --reload
```

## API Usage

Once the server is running, you can access the interactive API documentation (Swagger UI) at:

**[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

### Key Endpoints:
- `GET /hello`: Health check endpoint.
- `POST /auth/register`: Register a new user.

## Project Structure

This project follows a strict Layered Architecture to match the course requirements:

- `src/controllers`: Endpoint definitions (Presentation Layer).
- `src/services`: Business logic (Service Layer).
- `src/repositories`: Database interactions (Data Access Layer).
- `src/models`: SQLAlchemy database entities.