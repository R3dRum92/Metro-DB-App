from app.routes.common_imports import *

router = APIRouter()


class RouteStopRequest(BaseModel):
    route_id: str
    station_id: str
    stop_int: str


@router.post("/add_stop")
async def add_stop(stop_data: RouteStopRequest):
    try:
        conn = await get_db_connection()
        route_id = uuid.UUID(stop_data.route_id)
        station_id = uuid.UUID(stop_data.station_id)
        stop_int = int(stop_data.stop_int)
        try:
            await conn.execute(
                """
                INSERT INTO routes_stations(route_id, station_id, stop_int) VALUES ($1, $2, $3)
                """,
                route_id,
                station_id,
                stop_int,
            )
        except Exception as e:
            logger.error(f"Failed to add stop: {e}")

        return {
            "message": "Successfully added stop",
            "station_id": stop_data.station_id,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to connect to the database. Please try again.",
        ) from e
