from app.routes.common_imports import *

router = APIRouter()


class AddTrainRequest(BaseModel):
    train_code: str
    route_id: str
    capacity: str
    operational_status: str


@router.post("/add_train")
async def add_train(train_data: AddTrainRequest):
    try:
        conn = await get_db_connection()
        train_id = uuid.uuid4()
        route_id = uuid.UUID(train_data.route_id)
        capacity = int(train_data.capacity)
        operational_status = str(train_data.operational_status)
        train_code = str(train_data.train_code)

        try:
            await conn.execute(
                """
                INSERT INTO trains(train_id, train_code, route_id, capacity, operational_status) VALUES ($1, $2, $3, $4, $5)
                """,
                train_id,
                train_code,
                route_id,
                capacity,
                operational_status,
            )
        except Exception as e:
            logger.error(f"{e}")

        return {
            "message": "Add Route Successful",
            "train_id": train_id,
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to connect to database. Please try again.",
        ) from e
