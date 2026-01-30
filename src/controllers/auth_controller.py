from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Form, Request, Response, Cookie
from sqlalchemy.orm import Session
from src.database import get_db
from src.services.user_service import UserService
from src.schemas import UserCreate, UserResponse
from src.security import create_access_token, get_current_user, create_refresh_token, REFRESH_TOKEN_EXPIRE_DAYS
from src.models.user import User
from src.models.token import RefreshToken
from src.logging_config import logger
from src.limiter import limiter

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
    logger.info(f"New user registered: {created_user.username}")
    return created_user

@router.post("/login")
@limiter.limit("5/minute")
def login_for_access_token(
    request: Request,
    response: Response,
    username: str = Form(...),
    password: str = Form(...),
    service: UserService = Depends(get_user_service),
    db: Session = Depends(get_db)
):
    ip = request.client.host
    logger.info(f"Login attempt for user: {username} from IP: {ip}")
    
    user = service.authenticate_user(identifier=username, password=password)
    if not user:
        logger.warning(f"Failed login attempt for user: {username} from IP: {ip}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate Tokens
    access_token = create_access_token(data={"sub": user.email})
    refresh_token_str = create_refresh_token()
    
    # Save Refresh Token
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    # Convert expires_at to naive datetime if using SQLite which usually stores naive
    # But SQLAlchemy + SQLite usually handles naive best.
    # Let's ensure it's naive UTC for compatibility if needed, or aware.
    # SQLAlchemy DateTime typically takes naive unless configured.
    # We'll use naive UTC.
    expires_at_naive = expires_at.replace(tzinfo=None)
    
    db_refresh_token = RefreshToken(
        token=refresh_token_str,
        user_id=user.id,
        expires_at=expires_at_naive
    )
    db.add(db_refresh_token)
    db.commit()
    
    # Set HttpOnly Cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_str,
        httponly=True,
        secure=False, # Set to True in Production (HTTPS)
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    
    logger.info(f"Successful login for user: {username}")
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/refresh")
def refresh_token(
    response: Response,
    request: Request,
    refresh_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")

    # Find token in DB
    token_entry = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
    
    if not token_entry:
        # Potential Reuse or Invalid Token
        logger.warning(f"Attempted use of invalid refresh token from IP: {request.client.host}")
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if token_entry.revoked:
        # SECURITY ALERT: Revoked token used!
        logger.critical(f"SECURITY ALERT: Revoked refresh token used! User ID: {token_entry.user_id}, IP: {request.client.host}")
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked")

    if token_entry.expires_at < datetime.utcnow():
        logger.info(f"Expired refresh token used. User ID: {token_entry.user_id}")
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

    # Token Valid -> Rotate
    # 1. Revoke/Delete old
    db.delete(token_entry)
    db.commit()
    
    # 2. Issue New
    user = db.query(User).filter(User.id == token_entry.user_id).first()
    new_access_token = create_access_token(data={"sub": user.email})
    new_refresh_token_str = create_refresh_token()
    
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    new_db_token = RefreshToken(
        token=new_refresh_token_str,
        user_id=user.id,
        expires_at=expires_at
    )
    db.add(new_db_token)
    db.commit()
    
    # Set New Cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token_str,
        httponly=True,
        secure=False, 
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    
    logger.info(f"Token refreshed for user: {user.username}")
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(
    response: Response,
    refresh_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    if refresh_token:
        token_entry = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
        if token_entry:
            # We can mark as revoked or delete. Deleting cleans up DB. Revoking allows auditing.
            # Lab usually asks to "Revoke".
            token_entry.revoked = True
            db.commit()
            logger.info(f"User logged out, token revoked. User ID: {token_entry.user_id}")
    
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user