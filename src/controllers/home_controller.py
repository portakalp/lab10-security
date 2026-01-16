from fastapi import APIRouter, Header, Depends
from fastapi.responses import JSONResponse
from src.security import get_current_user
from src.models.user import User

router = APIRouter()

@router.get("/hello")
def say_hello(current_user: User = Depends(get_current_user)):
    return JSONResponse(content={"message": f"Hello {current_user.username}"})

# This endpoint remains public
@router.get("/agent")
def get_user_agent(user_agent: str = Header(None)):
    return {"user_agent": user_agent}
