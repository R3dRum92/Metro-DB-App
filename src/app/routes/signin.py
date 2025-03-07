from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import Field

from app.routes.common_imports import *

# JWT configuration
SECRET_KEY = "I love autoshy"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class SigninRequest(BaseModel):
    phone: str = Field(..., pattern="^[0-9]{11}$")
    password: str = Field(..., min_length=6)


pwd_context = CryptContext(schemes=["bcrypt"])


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


router = APIRouter()


@router.post("/signin", response_model=TokenResponse)
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
