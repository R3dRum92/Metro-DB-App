from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: str = Field(..., pattern="^[0-9]{10}$")


class SignupResponse(BaseModel):
    success: bool
    message: str


fake_db = {}

app = FastAPI()


@app.on_event("startup")
async def startup():
    from app.db.init_db import run_migrations

    run_migrations()


@app.get("/")
async def root():
    return {"message": "Metro System API is up and running!"}


@app.post("/signup")
async def signup(user: SignupRequest):
    if user.email in fake_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"errors": {"email": ["Email is already registered"]}},
        )

    fake_db[user.email] = {
        "name": user.name,
        "password": user.password,
        "phone": user.phone,
    }

    return SignupResponse(success=True, message="Signup Successful!")
