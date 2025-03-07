from typing import List, Optional

from app.routes.common_imports import *

router = APIRouter()


class RouteStopResponse(BaseModel):
    station_id: uuid.UUID
    station_name: str
    station_location: str
    stop_int: int
    ticket_price: Optional[int] = None


class RouteResponse(BaseModel):
    route_id: uuid.UUID
    route_name: str
    start_station_id: Optional[uuid.UUID] = None
    start_station_name: str
    end_station_id: Optional[uuid.UUID] = None
    end_station_name: str
    stops: Optional[List[RouteStopResponse]] = None


@router.get("/routes", response_model=list[RouteResponse])
async def get_routes():
    try:
        conn = await get_db_connection()
        try:
            rows = await conn.fetch(
                """
                SELECT r.route_id AS route_id, r.route_name AS route_name, s.station_name AS start_station_name, t.station_name AS end_station_name
                FROM routes r 
                    JOIN stations s ON r.start_station_id = s.station_id
                    JOIN stations t ON r.end_station_id = t.station_id
                ORDER BY route_name
                """
            )
            print(rows)
            routes = [
                RouteResponse(
                    route_id=row["route_id"],
                    route_name=row["route_name"],
                    start_station_name=row["start_station_name"],
                    end_station_name=row["end_station_name"],
                )
                for row in rows
            ]
            return routes
        except Exception as e:
            logger.error(f"Error fetching stations: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch stations. Please try again later.",
            )
        finally:
            await conn.close()
    except Exception as e:
        pass
