from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()

# Equivalent to @RestController
# @GetMapping("/hello")
@router.get("/hello")
def say_hello():
    return JSONResponse(content={"message": "OK"})
