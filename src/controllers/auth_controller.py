from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from src.database import get_db
from src.services.user_service import UserService
from src.schemas import UserCreate, UserResponse, LoginRequest
from src.security import create_access_token, get_current_user
from src.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])

def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    user_dto: UserCreate, 
    service: UserService = Depends(get_user_service)
):
    existing_user = service.user_repository.find_by_email(user_dto.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    
    created_user = service.create_user(
        username=user_dto.username,
        email=user_dto.email,
        password=user_dto.password
    )
    return created_user

@router.post("/login")
def login_for_access_token(
    username: str = Form(...),
    password: str = Form(...),
    service: UserService = Depends(get_user_service)
):
    print(f"Login attempt for: {username}")
    # Ensure that if user_service.authenticate_user returns None/False, 
    # the endpoint raises an HTTPException with status code 401 Unauthorized.
    user = service.authenticate_user(identifier=username, password=password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
