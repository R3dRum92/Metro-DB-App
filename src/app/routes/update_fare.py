from app.routes.common_imports import *

router = APIRouter()


class FareUpdate(BaseModel):
    origin_station_id: str
    destination_station_id: str
    new_price: int


@router.post("/update_fare")
async def update_fare(fare_update: FareUpdate):
    try:
        conn = await get_db_connection()
        station1_id = uuid.UUID(fare_update.origin_station_id)
        station2_id = uuid.UUID(fare_update.destination_station_id)
        price = int(fare_update.new_price)
        try:
            row = await conn.fetchrow(
                """
                SELECT *
                FROM ticket_price
                WHERE (station1_id = $1 AND station2_id = $2) 
                    OR (station1_id = $2 AND station2_id = $1)
                """,
                station1_id,
                station2_id,
            )

            if row:
                try:
                    await conn.execute(
                        """
                        UPDATE ticket_price
                        SET price = $3
                        WHERE (station1_id = $1 AND station2_id = $2) 
                            OR (station1_id = $2 AND station2_id = $1) 
                        """,
                        station1_id,
                        station2_id,
                        price,
                    )
                except Exception as e:
                    logger.error(f"Error updating tickets: {str(e)}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to update ticket_price. Please try again",
                    )

            else:
                try:
                    await conn.execute(
                        """

                        INSERT INTO ticket_price(station1_id, station2_id, price)
                        VALUES ($1, $2, $3)
                        """,
                        station1_id,
                        station2_id,
                        price,
                    )
                except Exception as e:
                    logger.error(f"Error inserting tickets: {str(e)}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to update ticket_price. Please try again",
                    )
        except Exception as e:
            logger.error(f"Error fetching tickets: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update ticket_price. Please try again",
            )
    except Exception as e:
        logger.error(f"Error connecting to the database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to connect to the database. Please try again later.",
        )
