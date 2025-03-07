from typing import Optional

from pydantic import EmailStr

from app.routes.common_imports import *

router = APIRouter()


class UserDetailResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: Optional[EmailStr] = None
    phone: str
    wallet: float


@router.get("/users/{user_id}", response_model=UserDetailResponse)
async def get_user(user_id: uuid.UUID):
    try:
        conn = await get_db_connection()
        try:
            user = await conn.fetchrow(
                """
                SELECT u.id, u.name, u.email, u.phone_number, w.balance
                FROM users u
                JOIN wallets w ON u.id = w.user_id
                WHERE u.id = $1
                """,
                user_id,
            )

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
                )

            return UserDetailResponse(
                id=user["id"],
                name=user["name"],
                email=user["email"],
                phone=user["phone_number"],
                wallet=user["balance"],
            )
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error fetching user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch user details. Please try again later.",
            )
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to the database. Please try again later.",
        )
