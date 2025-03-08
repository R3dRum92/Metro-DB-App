from app.routes.common_imports import *

router = APIRouter()


class UpdateTrainRequest(BaseModel):
    train_code: str
    route_id: uuid.UUID
    capacity: int
    operational_status: str


@router.put("/update_train/{train_id}")
async def update_train(train_update: UpdateTrainRequest, train_id: uuid.UUID):
    try:
        conn = await get_db_connection()

        try:
            existing_row = await conn.fetchrow(
                """
                SELECT * FROM trains
                WHERE train_id = $1
                """,
                train_id,
            )

            if not existing_row:
                logger.error("Failed to update strain")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Failed to update station: {train_update.train_code}",
                )

            await conn.execute(
                """
                UPDATE trains
                SET train_code = $1, route_id = $2, capacity = $3, operational_status = $4
                WHERE train_id = $5
                """,
                train_update.train_code,
                train_update.route_id,
                train_update.capacity,
                train_update.operational_status,
                train_id,
            )

            await conn.close()
            return {
                "message": f"Successfully updated station: {train_update.train_code}"
            }
        except Exception as e:
            logger.error(f"Failed to update route: {str(e)}")
            await conn.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update route: {train_update.train_code}",
            )
    except Exception as e:
        logger.error(f"Failed to connect to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update route: {train_update.train_code}",
        )
