from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# Equivalent to Spring Boot's DataSource configuration
# check_same_thread=False is needed only for SQLite
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Dependency injection for database sessions.
    Equivalent to injecting an EntityManager or Repository in Spring.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
