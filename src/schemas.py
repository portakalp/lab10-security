from pydantic import BaseModel

# Equivalent to DTOs (Data Transfer Objects) in Spring
class UserCreateDTO(BaseModel):
    username: str
    email: str
    password: str

class UserResponseDTO(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        orm_mode = True
