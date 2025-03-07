from app.routes.common_imports import *

router = APIRouter()


@router.get("/dashboard_metrics")
async def get_dashboard_metrics():
    """
    Get metrics for the dashboard including counts and statistics.
    This endpoint performs several database queries to calculate key metrics.
    """
    try:
        conn = await get_db_connection()
        try:
            # Get total counts
            total_stations = await conn.fetchval("SELECT COUNT(*) FROM stations")
            total_trains = await conn.fetchval("SELECT COUNT(*) FROM trains")
            total_routes = await conn.fetchval("SELECT COUNT(*) FROM routes")
            total_users = await conn.fetchval("SELECT COUNT(*) FROM users")

            # Count stations by status
            construction_stations = await conn.fetchval(
                "SELECT COUNT(*) FROM stations WHERE status = 'construction'"
            )
            planned_stations = await conn.fetchval(
                "SELECT COUNT(*) FROM stations WHERE status = 'planned'"
            )
            active_stations = await conn.fetchval(
                "SELECT COUNT(*) FROM stations WHERE status = 'active'"
            )

            # Get active trains count and percentage
            active_trains = await conn.fetchval(
                "SELECT COUNT(*) FROM trains WHERE operational_status = 'active'"
            )

            active_percentage = 0
            if total_trains > 0:
                active_percentage = (active_trains / total_trains) * 100

            # Get route with most stations
            busiest_route = await conn.fetchrow(
                """
                SELECT r.route_name, COUNT(rs.station_id) as station_count
                FROM routes r
                JOIN routes_stations rs ON r.route_id = rs.route_id
                GROUP BY r.route_name
                ORDER BY station_count DESC
                LIMIT 1
                """
            )

            busiest_route_name = None
            busiest_route_station_count = 0
            if busiest_route:
                busiest_route_name = busiest_route["route_name"]
                busiest_route_station_count = busiest_route["station_count"]

            # Get most common train status other than active/inactive
            status_distribution = await conn.fetch(
                """
                SELECT operational_status, COUNT(*) as count
                FROM trains
                GROUP BY operational_status
                ORDER BY count DESC
                """
            )

            status_counts = [
                {"status": row["operational_status"], "count": row["count"]}
                for row in status_distribution
            ]

            # Get total transaction value (if you have transactions)
            try:
                total_transactions = await conn.fetchval(
                    "SELECT COUNT(*) FROM user_history WHERE action = 'Ticket Purchase'"
                )
            except:
                total_transactions = 0

            # Calculate system health score (example)
            system_health = 100
            if total_trains > 0:
                system_health = min(
                    100, active_percentage + 20
                )  # Simple health calculation

            return {
                "totalStations": total_stations,
                "totalTrains": total_trains,
                "totalRoutes": total_routes,
                "totalUsers": total_users,
                "activeTrains": active_trains,
                "activeTrainsPercentage": active_percentage,
                "constructionStations": construction_stations,
                "plannedStations": planned_stations,
                "activeStations": active_stations,
                "busiestRoute": busiest_route_name,
                "busiestRouteStationCount": busiest_route_station_count,
                "statusDistribution": status_counts,
                "totalTransactions": total_transactions,
                "systemHealth": system_health,
            }

        except Exception as e:
            logger.error(f"Error fetching dashboard metrics: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch dashboard metrics. Please try again later.",
            )
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to the database. Please try again later.",
        )
