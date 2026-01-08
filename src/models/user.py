from sqlalchemy import Column, Integer, String
from src.database import Base

# Equivalent to Spring Boot's @Entity
# @Table(name = "users")
class User(Base):
    __tablename__ = "users"

    # Equivalent to @Id @GeneratedValue
    id = Column(Integer, primary_key=True, index=True)
    
    # Equivalent to @Column(unique = true)
    username = Column(String, unique=True, index=True)
    
    # Equivalent to @Column(unique = true)
    email = Column(String, unique=True, index=True)
    
    password = Column(String)
