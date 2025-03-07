from typing import Optional

from pydantic import EmailStr

from app.routes.common_imports import *


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: Optional[EmailStr] = None
    phone: str
    wallet: float
    history: str


router = APIRouter()


@router.get("/users")
async def get_users():
    try:
        conn = await get_db_connection()

        try:
            rows = await conn.fetch(
                """
                SELECT * FROM users JOIN wallets on users.id = wallets.user_id
                """
            )
            # return rows
            # logger.info(result)
            users = [
                UserResponse(
                    id=row["id"],
                    name=row["name"],
                    email=row["email"],
                    phone=row["phone_number"],
                    wallet=row["balance"],
                    history="/protected/user-history/" + str(row["id"]),
                )
                for row in rows
            ]

            return users
        except Exception as e:
            logger.error(f"Error fetching users from database: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error fetching users from database. Please try again later.",
            )
        finally:
            await conn.close()
    except Exception as e:
        pass
