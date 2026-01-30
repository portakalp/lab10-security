from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from src.controllers import home_controller, auth_controller, leaderboard_controller
from src.database import engine, Base
from src.middleware.security_headers import SecurityHeadersMiddleware
from src.limiter import limiter
from src.logging_config import setup_logging

# Initialize Logging
setup_logging()

# Equivalent to SpringApplication.run()
app = FastAPI(title="Lab 10 Security App")

# --- Rate Limiter ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Middleware ---
# Security Headers (Custom)
app.add_middleware(SecurityHeadersMiddleware)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Exception Handlers ---
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Sanitize the error details to handle bytes (which are not JSON serializable)
    errors = exc.errors()
    for error in errors:
        if 'input' in error and isinstance(error['input'], bytes):
            error['input'] = "<bytes omitted>"
            
    # Use logger instead of print
    import logging
    logger = logging.getLogger("app_logger")
    logger.error(f"Validation Error: {errors}")
    
    try:
        # Try to parse as JSON first
        body = await request.json()
        logger.debug(f"Request Body (JSON): {body}")
    except Exception:
        # If JSON parse fails, it might be form data or bytes
        logger.debug("Request Body: <Could not parse as JSON, likely Form Data>")
        
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": errors},
    )

# Initialize Database (Create tables)
# Note: Migrations (Alembic) are preferred, but this ensures tables exist if migrations aren't run.
Base.metadata.create_all(bind=engine)

# Register Controllers (Routers)
app.include_router(home_controller.router)
app.include_router(auth_controller.router)
app.include_router(leaderboard_controller.router)

if __name__ == "__main__":
    import uvicorn
    # Runs the server on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)