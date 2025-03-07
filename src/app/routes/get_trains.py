from app.routes.common_imports import *

router = APIRouter()


class TrainResponse(BaseModel):
    train_id: uuid.UUID
    train_code: str
    route_id: uuid.UUID
    capacity: int
    operational_status: str
    route_name: str


@router.get("/trains", response_model=list[TrainResponse])
async def get_trains():
    try:
        conn = await get_db_connection()
        try:
            rows = await conn.fetch(
                """
                SELECT t.train_id, t.train_code, t.route_id, t.capacity, t.operational_status, r.route_name
                FROM trains t
                JOIN routes r ON t.route_id = r.route_id
                """
            )
            trains = [
                TrainResponse(
                    train_id=row["train_id"],
                    train_code=row["train_code"],
                    route_id=row["route_id"],
                    capacity=row["capacity"],
                    operational_status=row["operational_status"],
                    route_name=row["route_name"],
                )
                for row in rows
            ]
            return trains
        except Exception as e:
            logger.error(f"Error fetching trains: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch trains. Please try again later.",
            )
        finally:
            await conn.close()
    except Exception as e:
        pass
