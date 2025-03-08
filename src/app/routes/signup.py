from datetime import date, datetime
from typing import Optional

from dateutil.relativedelta import relativedelta
from passlib.context import CryptContext
from pydantic import EmailStr, Field, field_validator

from app.routes.common_imports import *

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"])


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: Optional[EmailStr] = ""
    password: str = Field(..., min_length=6)
    phone: str = Field(..., pattern="^[0-9]{11}$")
    dateOfBirth: str = Field(...)

    @field_validator("email", mode="before")
    def normalize_email(cls, value):
        if value == "":
            return None
        return value

    @field_validator("dateOfBirth", mode="before")
    def validate_date_of_birth(cls, value):
        try:
            # Validate date format
            datetime.strptime(value, "%Y-%m-%d")
            return value
        except ValueError:
            raise ValueError("Invalid date format. Use YYYY-MM-DD format.")


@router.post("/signup")
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

            if user.email:
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

            # Convert string date to datetime.date object
            birth_date = datetime.strptime(user.dateOfBirth, "%Y-%m-%d").date()

            user_id = str(uuid.uuid4())
            wallet_id = str(uuid.uuid4())
            current_time = datetime.now()
            valid_until = current_time + relativedelta(years=5)

            await conn.execute(
                """
                INSERT INTO users (id, email, password_hash, name, phone_number, date_of_birth) 
                VALUES ($1, $2, $3, $4, $5, $6)
                """,
                user_id,
                user.email,
                hashed_password,
                user.name,
                user.phone,
                birth_date,  # Pass the converted date object, not the string
            )

            await conn.execute(
                """
                INSERT INTO wallets(ticket_id, user_id, balance, valid_from, valid_until) 
                VALUES ($1, $2, $3, $4, $5)
                """,
                wallet_id,
                user_id,
                300.0,
                current_time,
                valid_until,
            )

            return {
                "message": "Sign up successful",
                "user_id": user_id,
                "wallet_id": wallet_id,
            }

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
