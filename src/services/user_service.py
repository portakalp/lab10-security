from sqlalchemy.orm import Session
from src.repositories.user_repository import UserRepository
from src.models.user import User
from src.security import get_password_hash, verify_password
from typing import Optional

class UserService:
    def __init__(self, db: Session):
        self.user_repository = UserRepository(db)

    def create_user(self, username: str, email: str, password: str) -> User:
        hashed_password = get_password_hash(password)
        new_user = User(username=username, email=email, password=hashed_password)
        return self.user_repository.save(new_user)

    def authenticate_user(self, identifier: str, password: str) -> Optional[User]:
        # 1. Search DB for user by email OR username
        user = self.user_repository.find_by_identifier(identifier)

        # 2. If user does NOT exist, return None
        if not user:
            return None
            
        # 3. If user DOES exist, verify the plain text password against user.password
        if not verify_password(password, user.password):
            # 4. If password does not match, return None
            return None
            
        # 5. Only return the user object if the password matches
        return user