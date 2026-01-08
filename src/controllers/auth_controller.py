from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.services.user_service import UserService
from src.schemas import UserCreateDTO, UserResponseDTO

router = APIRouter(prefix="/auth", tags=["Auth"])

# Equivalent to @RestController with @RequestMapping("/auth")
# In Spring, the Service is autowired. Here we resolve it per request.

def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)

# Equivalent to @PostMapping("/register")
@router.post("/register", response_model=UserResponseDTO, status_code=status.HTTP_201_CREATED)
def register_user(
    user_dto: UserCreateDTO, 
    service: UserService = Depends(get_user_service)
):
    # Check if user exists (logic could be in service, but simple check here)
    # Ideally, handle exceptions from service
    existing_user = service.user_repository.find_by_email(user_dto.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    created_user = service.create_user(
        username=user_dto.username,
        email=user_dto.email,
        password=user_dto.password
    )
    return created_user
