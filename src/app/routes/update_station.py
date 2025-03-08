from app.routes.common_imports import *

router = APIRouter()


class UpdateStationRequest(BaseModel):
    name: str
    location: str
    status: str


@router.put("/update_station/{station_id}")
async def update_station(station_update: UpdateStationRequest, station_id: uuid.UUID):
    try:
        conn = await get_db_connection()

        try:
            existing_row = await conn.fetchrow(
                """
                SELECT * FROM stations
                WHERE station_id = $1
                """,
                station_id,
            )

            if not existing_row:
                logger.error("Failed to update station")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Failed to update station: {station_update.name}",
                )

            if existing_row["station_name"] != station_update.name:
                try:
                    await conn.execute(
                        """
                        UPDATE stations
                        SET station_name = $1
                        WHERE station_id = $2
                        """,
                        station_update.name,
                        station_id,
                    )
                except Exception as e:
                    logger.error(f"Failed to update station: {str(e)}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to update route: {station_update.name}",
                    )

            if existing_row["location"] != station_update.location:
                try:
                    await conn.execute(
                        """
                        UPDATE stations
                        SET location = $1
                        WHERE station_id = $2
                        """,
                        station_update.location,
                        station_id,
                    )
                except Exception as e:
                    logger.error(f"Failed to update station: {str(e)}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to update route: {station_update.name}",
                    )

            if existing_row["status"] != station_update.status:
                try:
                    await conn.execute(
                        """
                        UPDATE stations
                        SET status = $1
                        WHERE station_id = $2
                        """,
                        station_update.status,
                        station_id,
                    )
                except Exception as e:
                    logger.error(f"Failed to update station: {str(e)}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to update route: {station_update.name}",
                    )
            await conn.close()
            return {"message": f"Successfully updated station: {station_update.name}"}
        except Exception as e:
            logger.error(f"Failed to update route: {str(e)}")
            await conn.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update route: {station_update.name}",
            )
    except Exception as e:
        logger.error(f"Failed to connect to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update route: {station_update.name}",
        )
