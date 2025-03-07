from datetime import datetime
from typing import List

from app.routes.common_imports import *

router = APIRouter()


class UserHistoryEntry(BaseModel):
    id: uuid.UUID
    action: str
    date: datetime
    details: str


@router.get("/users/{user_id}/history", response_model=List[UserHistoryEntry])
async def get_user_history(user_id: uuid.UUID):
    try:
        conn = await get_db_connection()
        try:
            # Check if user exists
            user_exists = await conn.fetchrow(
                "SELECT id FROM users WHERE id = $1", user_id
            )

            if not user_exists:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
                )

            # Get user history entries
            rows = await conn.fetch(
                """
                SELECT id, action, date, details 
                FROM user_history
                WHERE user_id = $1
                ORDER BY date DESC
                LIMIT 50
                """,
                user_id,
            )

            history = [
                UserHistoryEntry(
                    id=row["id"],
                    action=row["action"],
                    date=row["date"],
                    details=row["details"],
                )
                for row in rows
            ]

            return history

        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error fetching user history: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch user history. Please try again later.",
            )
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to the database. Please try again later.",
        )
