import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.db.connection import get_db_connection
from app.db.init_db import create_tables
from app.utils.logger import logger

# JWT configuration
SECRET_KEY = "I love autoshy"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


pwd_context = CryptContext(schemes=["bcrypt"])


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: Optional[EmailStr] = ""
    password: str = Field(..., min_length=6)
    phone: str = Field(..., pattern="^[0-9]{11}$")

    @field_validator("email", mode="before")
    def normalize_email(cls, value):
        if value == "":
            return None
        return value


class SigninRequest(BaseModel):
    phone: str = Field(..., pattern="^[0-9]{11}$")
    password: str = Field(..., min_length=6)


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
            existing_user = await conn.fetchrow(
                "SELECT id FROM users WHERE phone_number = $1", user.phone
            )

            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "errors": {
                            "phone": ["User with this phone number already exists"]
                        }
                    },
                )

            existing_user = await conn.fetchrow(
                "SELECT id FROM users WHERE email = $1", user.email
            )
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "errors": {"email": ["User with this email already exists"]}
                    },
                )

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
            return {"message": "Sign up successful", "user_id": user_id}

        except HTTPException as e:
            raise e

        except Exception as e:
            logger.info(f"Failed to create the user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create the user. Please try again.",
            ) from e
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.info(f"Failed to connect to the database.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to connect to the database. Please try again.",
        ) from e


@app.post("/signin", response_model=TokenResponse)
async def signin(form_data: SigninRequest):
    try:
        conn = await get_db_connection()
        user = await conn.fetchrow(
            "SELECT * FROM users WHERE phone_number = $1", form_data.phone
        )
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"errors": {"form": ["Invalid phone number or password"]}},
            )

        if not verify_password(form_data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"errors": {"form": ["Invalid phone number or password"]}},
            )

        access_token = create_access_token(
            data={
                "sub": user["phone_number"],
                "user_id": str(user["id"]),
                "role": user["role"],
            }
        )

        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException as e:
        raise e

    except Exception as e:
        logger.error(f"Sign in failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process sign in. Please try again later.",
        )
