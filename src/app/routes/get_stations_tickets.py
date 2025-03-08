from app.routes.common_imports import *
from app.routes.get_stations import StationResponse

router = APIRouter()


@router.get("/stations_ticket", response_model=list[StationResponse])
async def get_stations():
    try:
        conn = await get_db_connection()
        try:
            rows = await conn.fetch(
                """
                SELECT * FROM stations 
                WHERE status = 'active'
                ORDER BY status, location, station_name
                """
            )
            stations = [
                StationResponse(
                    station_id=row["station_id"],
                    name=row["station_name"],
                    location=row["location"],
                    status=row["status"],
                )
                for row in rows
            ]
            return stations
        except Exception as e:
            logger.error(f"Error fetching routes: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch stations. Please try again later.",
            )
        finally:
            await conn.close()
    except Exception as e:
        pass
