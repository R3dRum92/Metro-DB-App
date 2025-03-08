from app.routes.common_imports import *

router = APIRouter()


@router.delete("/delete_station/{station_id}")
async def delete_station(station_id: uuid.UUID):
    try:
        conn = await get_db_connection()

        try:
            await conn.execute(
                """
                DELETE FROM stations
                WHERE station_id = $1
                """,
                station_id,
            )
            await conn.close()
            return {"message": f"Successfully deleted station"}
        except Exception as e:
            logger.error(f"Failed to delete station: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Failed to delete station: {str(e)}",
            )
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Failed to connect to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect to database. Please try again",
        )
