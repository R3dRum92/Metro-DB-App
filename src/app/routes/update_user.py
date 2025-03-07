from datetime import datetime
from typing import Optional

from pydantic import EmailStr, Field

from app.routes.common_imports import *
from app.routes.get_users_by_user_id import UserDetailResponse

router = APIRouter()


class UpdateUserRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: Optional[EmailStr] = None
    phone: str = Field(..., pattern="^[0-9]{11}$")
    wallet: float = Field(..., ge=0)


@router.put("/users/{user_id}", response_model=UserDetailResponse)
async def update_user(user_id: uuid.UUID, user_data: UpdateUserRequest):
    try:
        conn = await get_db_connection()
        try:
            # Check if user exists
            existing_user = await conn.fetchrow(
                "SELECT id FROM users WHERE id = $1", user_id
            )

            if not existing_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
                )

            # Check for email and phone uniqueness (excluding current user)
            if user_data.email:
                email_check = await conn.fetchrow(
                    "SELECT id FROM users WHERE email = $1 AND id != $2",
                    user_data.email,
                    user_id,
                )
                if email_check:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={
                            "errors": {
                                "email": ["Email is already in use by another user"]
                            }
                        },
                    )

            phone_check = await conn.fetchrow(
                "SELECT id FROM users WHERE phone_number = $1 AND id != $2",
                user_data.phone,
                user_id,
            )
            if phone_check:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "errors": {
                            "phone": ["Phone number is already in use by another user"]
                        }
                    },
                )

            # Update user details in transaction
            async with conn.transaction():
                # Update user table
                await conn.execute(
                    """
                    UPDATE users 
                    SET name = $1, email = $2, phone_number = $3
                    WHERE id = $4
                    """,
                    user_data.name,
                    user_data.email,
                    user_data.phone,
                    user_id,
                )

                # Update wallet
                await conn.execute(
                    """
                    UPDATE wallets
                    SET balance = $1
                    WHERE user_id = $2
                    """,
                    user_data.wallet,
                    user_id,
                )

                # Add entry to user history
                history_id = uuid.uuid4()
                now = datetime.now()
                await conn.execute(
                    """
                    INSERT INTO user_history (id, user_id, action, date, details)
                    VALUES ($1, $2, $3, $4, $5)
                    """,
                    history_id,
                    user_id,
                    "User Updated",
                    now,
                    f"User details updated: Name={user_data.name}, Email={user_data.email}, Phone={user_data.phone}, Wallet={user_data.wallet}",
                )

            # Get updated user details
            updated_user = await conn.fetchrow(
                """
                SELECT u.id, u.name, u.email, u.phone_number, w.balance
                FROM users u
                JOIN wallets w ON u.id = w.user_id
                WHERE u.id = $1
                """,
                user_id,
            )

            return UserDetailResponse(
                id=updated_user["id"],
                name=updated_user["name"],
                email=updated_user["email"],
                phone=updated_user["phone_number"],
                wallet=updated_user["balance"],
            )

        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error updating user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user. Please try again later.",
            )
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to the database. Please try again later.",
        )
