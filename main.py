from fastapi import FastAPI
from src.controllers import home_controller, auth_controller
from src.database import engine, Base

# Initialize Database (Create tables)
# In production with Alembic, we might not do this here, but for Lab setup it's convenient.
# Equivalent to Hibernate ddl-auto=update/create
Base.metadata.create_all(bind=engine)

# Equivalent to SpringApplication.run()
app = FastAPI(title="Lab 10 Security App")

# Register Controllers (Routers)
app.include_router(home_controller.router)
app.include_router(auth_controller.router)

if __name__ == "__main__":
    import uvicorn
    # Runs the server on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
