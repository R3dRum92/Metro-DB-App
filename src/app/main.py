import uuid
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, status
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field

from app.db.connection import get_db_connection
from app.db.init_db import create_tables
from app.utils.logger import logger

pwd_context = CryptContext(schemes=["bcrypt"])


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=6)
    phone: str = Field(..., pattern="^[0-9]{11}$")


class SignupResponse(BaseModel):
    success: bool
    message: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up... Connecting to the database.")
    connection = await get_db_connection()

    try:
        logger.info("Creating tables...")
        await create_tables(connection)
    finally:
        await connection.close()
        logger.info("Database connection closed")

    yield


app = FastAPI(lifespan=lifespan)


# @app.on_event("startup")
# async def startup():
#     from app.db.init_db import run_migrations

#     run_migrations()


@app.get("/")
async def root():
    return {"message": "Metro System API is up and running!"}


@app.get("/test-db")
async def test_db():
    try:
        conn = await get_db_connection()
        try:
            result = await conn.fetch("SELECT NOW() as current_time")
            return {"status": "success", "data": result}
        finally:
            await conn.close()
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/signup")
async def signup(user: SignupRequest):
    hashed_password = pwd_context.hash(user.password)

    try:
        conn = await get_db_connection()
        try:
            user_id = str(uuid.uuid4())
            await conn.execute(
                """
                INSERT INTO users (id, email, password_hash, name, phone_number) VALUES ($1, $2, $3, $4, $5)
                """,
                user_id,
                user.email,
                hashed_password,
                user.name,
                user.phone,
            )
            return {"message": "User created successfully", "user_id": user_id}
        except Exception as e:
            logger.info(f"Error: {str(e)}")
    except Exception as e:
        logger.info(f"Failed ")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to connect to the database. Please try again.",
        ) from e

    return SignupResponse(success=True, message="Signup Successful!")
