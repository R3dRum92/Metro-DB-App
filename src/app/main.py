import uuid
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional, Set, Tuple

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.connection import get_db_connection
from app.db.init_db import create_tables
from app.routes.add_route import router as add_route_router
from app.routes.add_station import router as add_station_router
from app.routes.add_stop import router as add_stop_router
from app.routes.add_train import router as add_train_router
from app.routes.calculate_fare import router as calculate_fare_router
from app.routes.delete_route import router as delete_route_router
from app.routes.delete_station import router as delete_station_router
from app.routes.delete_stop import router as delete_stop_router
from app.routes.delete_train import router as delete_train_router
from app.routes.delete_user import router as delete_user_router
from app.routes.get_dashboard_metrics import router as get_dashboard_metrics_router
from app.routes.get_routes import router as get_routes_router
from app.routes.get_routes_by_route_id import router as get_routes_by_route_id_router
from app.routes.get_stations import router as get_stations_router
from app.routes.get_stations_tickets import router as get_stations_tickets_router
from app.routes.get_trains import router as get_trains_router
from app.routes.get_user_history import router as get_user_history_router
from app.routes.get_users import router as get_users_router
from app.routes.get_users_by_user_id import router as get_users_by_user_id_router
from app.routes.routes_stations import router as count_stations_router
from app.routes.signin import router as signin_router
from app.routes.signup import router as signup_router
from app.routes.update_fare import router as update_fare_router
from app.routes.update_route import router as update_route_router
from app.routes.update_station import router as update_station_router
from app.routes.update_stop import router as update_stop_router
from app.routes.update_train import router as update_train_router
from app.routes.update_user import router as update_user_router
from app.routes.user_demographics import router as user_demographics_router
from app.utils.graph import WeightedGraph, graph
from app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up... Connecting to the database.")
    connection = await get_db_connection()
    global graph
    try:
        logger.info("Creating tables...")
        graph = await build_graph(graph)
        # await create_tables(connection)
    finally:
        await connection.close()
        logger.info("Database connection closed")

    yield


app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(get_users_router, prefix="", tags=["Users"])
app.include_router(get_stations_router, prefix="", tags=["Stations"])
app.include_router(get_stations_tickets_router, prefix="", tags=["Stations", "Tickets"])
app.include_router(get_routes_router, prefix="", tags=["Routes"])
app.include_router(get_routes_by_route_id_router, prefix="", tags=["Routes"])
app.include_router(get_trains_router, prefix="", tags=["Trains"])
app.include_router(signup_router, prefix="", tags=["Users"])
app.include_router(signin_router, prefix="", tags=["Users"])
app.include_router(add_station_router, prefix="", tags=["Stations"])
app.include_router(add_stop_router, prefix="", tags=["Routes", "Stations"])
app.include_router(add_route_router, prefix="", tags=["Routes"])
app.include_router(add_train_router, prefix="", tags=["Trains"])
app.include_router(get_users_by_user_id_router, prefix="", tags=["Users"])
app.include_router(update_user_router, prefix="", tags=["Users"])
app.include_router(get_user_history_router, prefix="", tags=["Users"])
app.include_router(calculate_fare_router, prefix="", tags=["Tickets"])
app.include_router(update_fare_router, prefix="", tags=["Tickets"])
app.include_router(get_dashboard_metrics_router, prefix="", tags=["Dashboard"])
app.include_router(update_route_router, prefix="", tags=["Routes"])
app.include_router(delete_route_router, prefix="", tags=["Routes"])
app.include_router(update_stop_router, prefix="", tags=["Routes"])
app.include_router(delete_stop_router, prefix="", tags=["Routes"])
app.include_router(delete_user_router, prefix="", tags=["Users"])
app.include_router(update_station_router, prefix="", tags=["Stations"])
app.include_router(delete_station_router, prefix="", tags=["Stations"])
app.include_router(update_train_router, prefix="", tags=["Trains"])
app.include_router(delete_train_router, prefix="", tags={"Trains"})
app.include_router(user_demographics_router, prefix="", tags=["Users"])
app.include_router(count_stations_router, prefix="", tags=["Routes", "Stations"])


@app.get("/")
async def root():
    return {"message": "Metro System API is up and running!"}


@app.get("/test-db")
async def test_db():
    try:
        conn = await get_db_connection()
        try:
            result = await conn.fetch("SELECT NOW() as current_time")
            return {"status": "success", "data": result}
        finally:
            await conn.close()
    except Exception as e:
        return {"status": "error", "message": str(e)}


async def build_graph(graph: WeightedGraph) -> WeightedGraph:
    try:
        conn = await get_db_connection()

        rows = await conn.fetch(
            """
            SELECT * FROM hubs
            """
        )

        for row in rows:
            # Convert asyncpg UUID to Python's standard UUID
            station_id = uuid.UUID(str(row["station_id"]))
            graph.add_node(station_id)

            route1_id = row["route1_id"]
            route2_id = row["route2_id"]
            connected_stations = await conn.fetch(
                """
                SELECT station_id FROM routes_stations WHERE route_id = $1 OR route_id = $2
                """,
                route1_id,
                route2_id,
            )

            logger.info(connected_stations)

            for station in connected_stations:
                # Convert asyncpg UUID to Python's standard UUID
                connected_station_id = uuid.UUID(str(station["station_id"]))
                graph.add_node(connected_station_id)
                logger.info(connected_station_id)

                price = await conn.fetch(
                    """
                    SELECT price FROM ticket_price
                    WHERE (station1_id = $1 AND station2_id = $2)
                        OR (station1_id = $2 AND station2_id = $1)
                    """,
                    str(station_id),  # Convert UUID to string for SQL
                    str(connected_station_id),  # Convert UUID to string for SQL
                )

                if price and len(price) > 0:
                    # Check if price result exists and has at least one row
                    price_value = price[0][
                        "price"
                    ]  # Access first row and 'price' column
                    graph.add_bidirectional_edge(
                        station_id, connected_station_id, price_value
                    )
                else:
                    # Handle case where no price is found - you might want to set a default or log a warning
                    logger.warning(
                        f"No price found between stations {station_id} and {connected_station_id}"
                    )
                    # Optionally add edge with default price (e.g., 0.0) or skip adding this edge
                    # graph.add_edge(station_id, connected_station_id, 0.0)

        logger.info(
            f"Graph built successfully with {graph.get_node_count()} nodes and {graph.get_edge_count()} edges"
        )
        logger.info(f"{str(graph)}")
        logger.debug(str(graph))

        # Optionally return the graph if needed elsewhere
        return graph

    except Exception as e:
        logger.error(f"Error building graph: {str(e)}")
        # Re-raise or return None depending on how you want to handle failures
        raise
