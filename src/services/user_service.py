from sqlalchemy.orm import Session
from src.repositories.user_repository import UserRepository
from src.models.user import User

# Equivalent to Spring Boot's @Service
class UserService:
    def __init__(self, db: Session):
        # In Spring, this dependency would be @Autowired
        self.user_repository = UserRepository(db)

    def create_user(self, username: str, email: str, password: str) -> User:
        # In a real app, hash the password here (e.g., BCrypt)
        # Using placeholder logic as requested
        new_user = User(username=username, email=email, password=password)
        return self.user_repository.save(new_user)

    def authenticate(self, email: str, password: str) -> bool:
        # Placeholder authentication logic
        user = self.user_repository.find_by_email(email)
        if user and user.password == password:
             return True
        return False
