from app.routes.common_imports import *

router = APIRouter()


class UpdateRouteRequest(BaseModel):
    route_name: str
    start_station_id: uuid.UUID
    end_station_id: uuid.UUID


@router.put("/update_route/{route_id}")
async def update_route(route_update: UpdateRouteRequest, route_id: uuid.UUID):
    try:
        conn = await get_db_connection()

        try:
            existing_row = await conn.fetchrow(
                """
                SELECT * FROM routes
                WHERE route_id = $1
                """,
                route_id,
            )

            if not existing_row:
                logger.error("Failed to update route")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Failed to update route: {route_update.route_name}",
                )

            if existing_row["route_name"] != route_update.route_name:
                try:
                    await conn.execute(
                        """
                        UPDATE routes
                        SET route_name = $1
                        WHERE route_id = $2
                        """,
                        route_update.route_name,
                        route_id,
                    )
                except Exception as e:
                    logger.error(f"Failed to update route: {str(e)}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to update route: {route_update.route_name}",
                    )

            if existing_row["start_station_id"] != route_update.start_station_id:
                try:
                    await conn.execute(
                        """
                        UPDATE routes
                        SET start_station_id = $1
                        WHERE route_id = $2
                        """,
                        route_update.start_station_id,
                        route_id,
                    )
                except Exception as e:
                    logger.error(f"Failed to update route: {str(e)}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to update route: {route_update.route_name}",
                    )

            if existing_row["end_station_id"] != route_update.end_station_id:
                try:
                    await conn.execute(
                        """
                        UPDATE routes
                        SET end_station_id = $1
                        WHERE route_id = $2
                        """,
                        route_update.end_station_id,
                        route_id,
                    )
                except Exception as e:
                    logger.error(f"Failed to update route: {str(e)}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to update route: {route_update.route_name}",
                    )
        except Exception as e:
            logger.error(f"Failed to update route: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update route: {route_update.route_name}",
            )
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Failed to connect to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update route: {route_update.route_name}",
        )
