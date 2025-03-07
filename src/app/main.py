from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.connection import get_db_connection
from app.db.init_db import create_tables
from app.routes.add_route import router as add_route_router
from app.routes.add_station import router as add_station_router
from app.routes.add_stop import router as add_stop_router
from app.routes.add_train import router as add_train_router
from app.routes.calculate_fare import router as calculate_fare_router
from app.routes.get_dashboard_metrics import router as get_dashboard_metrics_router
from app.routes.get_routes import router as get_routes_router
from app.routes.get_routes_by_route_id import router as get_routes_by_route_id_router
from app.routes.get_stations import router as get_stations_router
from app.routes.get_stations_tickets import router as get_stations_tickets_router
from app.routes.get_trains import router as get_trains_router
from app.routes.get_user_history import router as get_user_history_router
from app.routes.get_users import router as get_users_router
from app.routes.get_users_by_user_id import router as get_users_by_user_id_router
from app.routes.signin import router as signin_router
from app.routes.signup import router as signup_router
from app.routes.update_fare import router as update_fare_router
from app.routes.update_user import router as update_user_router
from app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up... Connecting to the database.")
    connection = await get_db_connection()

    try:
        logger.info("Creating tables...")
        await create_tables(connection)
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
app.include_router(get_routes_by_route_id_router, prefix="", tags="Routes")
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
