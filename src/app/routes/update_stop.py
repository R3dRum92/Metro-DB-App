from app.routes.common_imports import *

router = APIRouter()


class UpdateStopRequest(BaseModel):
    route_id: uuid.UUID
    stop_int: int
    station_id: uuid.UUID


@router.put("/update_stop")
async def update_route(stop_update: UpdateStopRequest):
    try:
        conn = await get_db_connection()

        try:
            existing_row = await conn.fetchrow(
                """
                SELECT * FROM routes_stations
                WHERE route_id = $1
                    AND stop_int = $2
                """,
                stop_update.route_id,
                stop_update.stop_int,
            )

            if not existing_row:
                logger.error("Failed to update stop")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Failed to update stop: {stop_update.stop_int}",
                )

            if existing_row["station_id"] != stop_update.station_id:
                try:
                    await conn.execute(
                        """
                        UPDATE routes_stations
                        SET station_id = $1
                        WHERE route_id = $2
                            AND stop_int = $3
                        """,
                        stop_update.station_id,
                        stop_update.route_id,
                        stop_update.stop_int,
                    )
                    return {
                        "message": f"Successfully updated stop: {stop_update.stop_int}"
                    }
                except Exception as e:
                    logger.error(f"Failed to update route: {str(e)}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to update route: {stop_update.stop_int}",
                    )
        except Exception as e:
            logger.error(f"Failed to update route: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update route: {stop_update.stop_int}",
            )
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Failed to connect to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update route: {stop_update.stop_int}",
        )
