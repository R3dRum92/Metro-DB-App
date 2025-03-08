from app.routes.common_imports import *

router = APIRouter()


class DeleteStopRequest(BaseModel):
    route_id: uuid.UUID
    station_id: uuid.UUID
    stop_int: int


@router.delete("/delete_stop")
async def delete_stop(delete_stop: DeleteStopRequest):
    try:
        conn = await get_db_connection()

        try:
            await conn.execute(
                """
                DELETE FROM routes_stations
                WHERE route_id = $1
                    AND stop_int=$2
                    AND station_id=$3
                """,
                delete_stop.route_id,
                delete_stop.stop_int,
                delete_stop.station_id,
            )
            return {"message": f"Successfully deleted stop: {delete_stop.stop_int}"}
        except Exception as e:
            logger.error(f"Failed to delete stop: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Failed to delete stop: {str(e)}",
            )
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Failed to connect to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect to database. Please try again",
        )
