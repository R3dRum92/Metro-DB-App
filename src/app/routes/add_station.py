from app.routes.common_imports import *

router = APIRouter()


class AddStationRequest(BaseModel):
    name: str
    location: str


@router.post("/add_station")
async def add_station(form_data: AddStationRequest):
    try:
        conn = await get_db_connection()
        station_id = uuid.uuid4()
        await conn.execute(
            """
            INSERT INTO stations(station_id, station_name, location) VALUES ($1, $2, $3)
            """,
            station_id,
            form_data.name,
            form_data.location,
        )
        return {
            "message": f"Successfully added {form_data.name} Station at {form_data.location}",
            "station_id": station_id,
        }
    except Exception as e:
        logger.info(f"Failed to connect to the database.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to connect to the database. Please try again.",
        ) from e
