from app.routes.common_imports import *

router = APIRouter()


@router.delete("/delete_user/{user_id}")
async def delete_route(user_id: uuid.UUID):
    try:
        conn = await get_db_connection()

        try:
            await conn.execute(
                """
                DELETE FROM users
                WHERE id = $1
                """,
                user_id,
            )
            await conn.close()
            return {"message": f"Successfully deleted user: {str(user_id)}"}
        except Exception as e:
            logger.error(f"Failed to delete user: {str(e)}")
            await conn.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Failed to delete user: {str(e)}",
            )
    except Exception as e:
        logger.error(f"Failed to connect to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect to database. Please try again",
        )
