from typing import List

from app.routes.common_imports import *

router = APIRouter()


class RouteStation(BaseModel):
    route_id: uuid.UUID
    route_name: str
    station_count: int


@router.get("/routes_stations", response_model=List[RouteStation])
async def get_routes_stations():
    """
    Get all routes with their station counts.
    This endpoint returns each route with the number of stations it contains.
    """
    try:
        conn = await get_db_connection()
        try:
            # Query to count stations per route with route names
            rows = await conn.fetch(
                """
                WITH route_station_counts AS (
                  SELECT
                    rs.route_id,
                    COUNT(rs.station_id) AS station_count
                  FROM routes_stations rs
                  GROUP BY rs.route_id
                )
                SELECT
                  rsc.route_id,
                  r.route_name AS route_name,
                  rsc.station_count
                FROM route_station_counts rsc
                JOIN routes r ON rsc.route_id = r.route_id
                ORDER BY rsc.route_id
                """
            )

            result = []
            for row in rows:
                result.append(
                    {
                        "route_id": row["route_id"],
                        "route_name": row["route_name"],
                        "station_count": row["station_count"],
                    }
                )

            return result

        except Exception as e:
            logger.error(f"Error fetching routes and station counts: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch route station data. Please try again later.",
            )
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to the database. Please try again later.",
        )
