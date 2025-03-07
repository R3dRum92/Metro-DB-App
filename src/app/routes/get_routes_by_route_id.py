from app.routes.common_imports import *
from app.routes.get_routes import RouteResponse, RouteStopResponse

router = APIRouter()


@router.get("/routes/{route_id}", response_model=RouteResponse)
async def get_route_details(route_id: uuid.UUID):
    try:
        conn = await get_db_connection()
        try:
            rows = await conn.fetch(
                """
                SELECT r.route_id AS route_id, r.station_id AS station_id, s.station_name AS station_name, s.location AS station_location, r.stop_int AS stop_int, r.ticket_price AS ticket_price
                FROM routes_stations r
                    JOIN stations s ON r.station_id = s.station_id
                    WHERE r.route_id = $1
                ORDER BY r.stop_int
                """,
                route_id,
            )
            route = await conn.fetchrow(
                """
                SELECT r.route_id AS route_id, r.route_name AS route_name, s.station_id AS start_station_id, s.station_name AS start_station_name, t.station_id AS end_station_id, t.station_name AS end_station_name
                FROM routes r 
                    JOIN stations s ON r.start_station_id = s.station_id
                    JOIN stations t ON r.end_station_id = t.station_id
                WHERE r.route_id = $1
                ORDER BY route_name
                """,
                route_id,
            )
            stops = [
                RouteStopResponse(
                    station_id=row["station_id"],
                    station_name=row["station_name"],
                    station_location=row["station_location"],
                    stop_int=row["stop_int"],
                    ticket_price=row["ticket_price"],
                )
                for row in rows
            ]
            ret = RouteResponse(
                route_id=route_id,
                route_name=route["route_name"],
                start_station_id=route["start_station_id"],
                start_station_name=route["start_station_name"],
                end_station_id=route["end_station_id"],
                end_station_name=route["end_station_name"],
                stops=stops,
            )
            return ret
        except Exception as e:
            logger.error(f"Error fetching stops: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch stops. Plase try again later",
            )
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Error connecting to the database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to the database. Please try again later.",
        )
