from sqlalchemy.orm import Session
from src.models.user import User

# Equivalent to Spring Boot's @Repository (e.g., JpaRepository<User, Long>)
class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    # Equivalent to save(User user)
    def save(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    # Equivalent to findByEmail(String email)
    def find_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()
