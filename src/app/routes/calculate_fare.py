from app.routes.common_imports import *

router = APIRouter()


class FareResponse(BaseModel):
    origin_station_name: str
    destination_station_name: str
    price: int


@router.get("/calculate-fare", response_model=FareResponse)
async def calculate_fare(origin_station_id: str, destination_station_id: str):
    try:
        origin_id = uuid.UUID(origin_station_id)
        destination_id = uuid.UUID(destination_station_id)

        conn = await get_db_connection()
        try:
            # Get station details
            origin_station = await conn.fetchrow(
                "SELECT station_id, station_name, location FROM stations WHERE station_id = $1",
                origin_id,
            )

            destination_station = await conn.fetchrow(
                "SELECT station_id, station_name, location FROM stations WHERE station_id = $1",
                destination_id,
            )

            if not origin_station or not destination_station:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Origin or destination station not found",
                )

            # Find routes that contain both stations
            routes_with_both_stations = await conn.fetch(
                """
                SELECT r1.route_id 
                FROM routes_stations r1
                JOIN routes_stations r2 ON r1.route_id = r2.route_id
                WHERE r1.station_id = $1 AND r2.station_id = $2
                """,
                origin_id,
                destination_id,
            )

            if not routes_with_both_stations:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No route found connecting these stations",
                )

            # For simplicity, use the first route that contains both stations
            route_id = routes_with_both_stations[0]["route_id"]

            # Get stop positions for both stations on this route
            origin_stop = await conn.fetchrow(
                """
                SELECT stop_int, ticket_price 
                FROM routes_stations 
                WHERE route_id = $1 AND station_id = $2
                """,
                route_id,
                origin_id,
            )

            destination_stop = await conn.fetchrow(
                """
                SELECT stop_int, ticket_price 
                FROM routes_stations 
                WHERE route_id = $1 AND station_id = $2
                """,
                route_id,
                destination_id,
            )

            # Calculate fare based on ticket_price difference
            # If ticket_price is null, calculate based on stop position
            if (
                origin_stop["ticket_price"] is not None
                and destination_stop["ticket_price"] is not None
            ):
                # Use absolute difference to handle travel in either direction
                price = abs(
                    destination_stop["ticket_price"] - origin_stop["ticket_price"]
                )
            else:
                stop_difference = abs(
                    destination_stop["stop_int"] - origin_stop["stop_int"]
                )
                price = max(20, stop_difference)

            return FareResponse(
                origin_station_name=origin_station["station_name"],
                destination_station_name=destination_station["station_name"],
                price=price,
            )

        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error calculating fare: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error calculating fare. Please try again later.",
            )
        finally:
            await conn.close()

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid station ID format"
        )
    except Exception as e:
        logger.error(f"Error calculating fare: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating fare. Please try again later.",
        )
