from app.routes.common_imports import *

router = APIRouter()


@router.delete("/delete_train/{train_id}")
async def delete_train(train_id: uuid.UUID):
    try:
        conn = await get_db_connection()

        try:
            await conn.execute(
                """
                DELETE FROM trains
                WHERE train_id = $1
                """,
                train_id,
            )
            await conn.close()
            return {"message": f"Successfully deleted train"}
        except Exception as e:
            logger.error(f"Failed to delete train: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Failed to delete train: {str(e)}",
            )
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Failed to connect to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect to database. Please try again",
        )
