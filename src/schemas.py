from pydantic import BaseModel, EmailStr, field_validator, Field

# Updated DTO with validation
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(..., min_length=8)

    @field_validator('username')
    def username_must_not_be_admin(cls, v):
        if "admin" in v.lower():
            raise ValueError('Username cannot be "admin"')
        return v

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str
