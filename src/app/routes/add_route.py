from app.routes.common_imports import *

router = APIRouter()


class AddRouteRequest(BaseModel):
    route_name: str
    start_station_id: str
    end_station_id: str


@router.post("/add_route")
async def add_route(route_data: AddRouteRequest):
    try:
        conn = await get_db_connection()
        route_id = uuid.uuid4()
        start_station_id = uuid.UUID(route_data.start_station_id)
        end_station_id = uuid.UUID(route_data.end_station_id)

        await conn.execute(
            """
            INSERT INTO routes(route_id, route_name, start_station_id, end_station_id) VALUES ($1, $2, $3, $4)
            """,
            route_id,
            route_data.route_name,
            start_station_id,
            end_station_id,
        )

        await conn.execute(
            """
            INSERT INTO routes_stations(route_id, station_id, stop_int) VALUES ($1, $2, $3)
            """,
            route_id,
            start_station_id,
            1,
        )

        return {
            "message": "Add Route Successful",
            "route_id": route_id,
        }

    except Exception as e:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to connect to database. Please try again.",
        ) from e
