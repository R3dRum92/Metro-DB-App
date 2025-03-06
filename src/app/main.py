import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from zoneinfo import ZoneInfo

from dateutil.relativedelta import relativedelta
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.db.connection import get_db_connection
from app.db.init_db import create_tables
from app.utils.logger import logger

app = FastAPI()


# JWT configuration
SECRET_KEY = "I love autoshy"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


pwd_context = CryptContext(schemes=["bcrypt"])


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: Optional[EmailStr] = ""
    password: str = Field(..., min_length=6)
    phone: str = Field(..., pattern="^[0-9]{11}$")

    @field_validator("email", mode="before")
    def normalize_email(cls, value):
        if value == "":
            return None
        return value


class SigninRequest(BaseModel):
    phone: str = Field(..., pattern="^[0-9]{11}$")
    password: str = Field(..., min_length=6)


class AddStationRequest(BaseModel):
    name: str
    location: str


class SignupResponse(BaseModel):
    success: bool
    message: str


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: Optional[EmailStr] = None
    phone: str
    wallet: float
    history: str


class StationResponse(BaseModel):
    id: uuid.UUID
    name: str
    location: str
    status: str


class AddRouteRequest(BaseModel):
    route_name: str
    start_station_id: str
    end_station_id: str


class RouteStopResponse(BaseModel):
    station_id: uuid.UUID
    station_name: str
    station_location: str
    stop_int: int
    ticket_price: Optional[int] = None


class RouteResponse(BaseModel):
    route_id: uuid.UUID
    route_name: str
    start_station_id: Optional[uuid.UUID] = None
    start_station_name: str
    end_station_id: Optional[uuid.UUID] = None
    end_station_name: str
    stops: Optional[List[RouteStopResponse]] = None


class TrainResponse(BaseModel):
    train_id: uuid.UUID
    train_code: str
    route_id: uuid.UUID
    capacity: int
    operational_status: str
    route_name: str


## user edit parts
class UserDetailResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: Optional[EmailStr] = None
    phone: str
    wallet: float


class UpdateUserRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: Optional[EmailStr] = None
    phone: str = Field(..., pattern="^[0-9]{11}$")
    wallet: float = Field(..., ge=0)


## history details
class UserHistoryEntry(BaseModel):
    id: uuid.UUID
    action: str
    date: datetime
    details: str


class RouteStopRequest(BaseModel):
    route_id: str
    station_id: str
    stop_int: str


class AddTrainRequest(BaseModel):
    train_code: str
    route_id: str
    capacity: str
    operational_status: str

    ###    Fare


class FareCalculationRequest(BaseModel):
    origin_station_id: str
    destination_station_id: str


class FareResponse(BaseModel):
    origin_station_name: str
    destination_station_name: str
    price: int


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


# @app.on_event("startup")
# async def startup():
#     from app.db.init_db import run_migrations

#     run_migrations()


@app.get("/")
async def root():
    return {"message": "Metro System API is up and running!"}


@app.get("/users")
async def get_users():
    try:
        conn = await get_db_connection()

        try:
            rows = await conn.fetch(
                """
                SELECT * FROM users JOIN wallets on users.id = wallets.user_id
                """
            )
            # return rows
            # logger.info(result)
            users = [
                UserResponse(
                    id=row["id"],
                    name=row["name"],
                    email=row["email"],
                    phone=row["phone_number"],
                    wallet=row["balance"],
                    history="/protected/user-history/" + str(row["id"]),
                )
                for row in rows
            ]

            return users
        except Exception as e:
            logger.error(f"Error fetching users from database: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error fetching users from database. Please try again later.",
            )
        finally:
            await conn.close()
    except Exception as e:
        pass


@app.get("/stations", response_model=list[StationResponse])
async def get_stations():
    try:
        conn = await get_db_connection()
        try:
            rows = await conn.fetch(
                "SELECT * FROM stations ORDER BY status, location, station_name"
            )
            stations = [
                StationResponse(
                    id=row["station_id"],
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


@app.get("/routes", response_model=list[RouteResponse])
async def get_routes():
    try:
        conn = await get_db_connection()
        try:
            rows = await conn.fetch(
                """
                SELECT r.route_id AS route_id, r.route_name AS route_name, s.station_name AS start_station_name, t.station_name AS end_station_name
                FROM routes r 
                    JOIN stations s ON r.start_station_id = s.station_id
                    JOIN stations t ON r.end_station_id = t.station_id
                ORDER BY route_name
                """
            )
            print(rows)
            routes = [
                RouteResponse(
                    route_id=row["route_id"],
                    route_name=row["route_name"],
                    start_station_name=row["start_station_name"],
                    end_station_name=row["end_station_name"],
                )
                for row in rows
            ]
            return routes
        except Exception as e:
            logger.error(f"Error fetching stations: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch stations. Please try again later.",
            )
        finally:
            await conn.close()
    except Exception as e:
        pass


@app.get("/routes/{route_id}", response_model=RouteResponse)
async def get_route_details(route_id: uuid.UUID):
    try:
        conn = await get_db_connection()
        try:
            rows = await conn.fetch(
                """
                SELECT r.route_id AS route_id, r.station_id AS station_id, s.station_name AS station_name, s.location AS station_location, r.stop_int AS stop_int, r.ticket_price AS ticket_price
                FROM routes_stations r
                    JOIN stations s ON r.station_id = s.station_id
                    WHERE r.route_id = $1
                ORDER BY r.stop_int
                """,
                route_id,
            )
            route = await conn.fetchrow(
                """
                SELECT r.route_id AS route_id, r.route_name AS route_name, s.station_id AS start_station_id, s.station_name AS start_station_name, t.station_id AS end_station_id, t.station_name AS end_station_name
                FROM routes r 
                    JOIN stations s ON r.start_station_id = s.station_id
                    JOIN stations t ON r.end_station_id = t.station_id
                WHERE r.route_id = $1
                ORDER BY route_name
                """,
                route_id,
            )
            stops = [
                RouteStopResponse(
                    station_id=row["station_id"],
                    station_name=row["station_name"],
                    station_location=row["station_location"],
                    stop_int=row["stop_int"],
                    ticket_price=row["ticket_price"],
                )
                for row in rows
            ]
            ret = RouteResponse(
                route_id=route_id,
                route_name=route["route_name"],
                start_station_id=route["start_station_id"],
                start_station_name=route["start_station_name"],
                end_station_id=route["end_station_id"],
                end_station_name=route["end_station_name"],
                stops=stops,
            )
            return ret
        except Exception as e:
            logger.error(f"Error fetching stops: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch stops. Plase try again later",
            )
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Error connecting to the database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to the database. Please try again later.",
        )


@app.get("/trains", response_model=list[TrainResponse])
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


@app.post("/signup")
async def signup(user: SignupRequest):
    hashed_password = pwd_context.hash(user.password)

    try:
        conn = await get_db_connection()
        try:
            existing_user = await conn.fetchrow(
                "SELECT id FROM users WHERE phone_number = $1", user.phone
            )

            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "errors": {
                            "phone": ["User with this phone number already exists"]
                        }
                    },
                )

            existing_user = await conn.fetchrow(
                "SELECT id FROM users WHERE email = $1", user.email
            )
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "errors": {"email": ["User with this email already exists"]}
                    },
                )

            user_id = str(uuid.uuid4())
            wallet_id = str(uuid.uuid4())
            current_time = datetime.now()
            valid_until = current_time + relativedelta(years=5)
            await conn.execute(
                """
                INSERT INTO users (id, email, password_hash, name, phone_number) VALUES ($1, $2, $3, $4, $5)
                """,
                user_id,
                user.email,
                hashed_password,
                user.name,
                user.phone,
            )
            await conn.execute(
                """
                INSERT INTO wallets(ticket_id, user_id, balance, valid_from, valid_until) VALUES ($1, $2, $3, $4, $5)
                """,
                wallet_id,
                user_id,
                300.0,
                current_time,
                valid_until,
            )
            return {
                "message": "Sign up successful",
                "user_id": user_id,
                "wallet_id": wallet_id,
            }

        except HTTPException as e:
            raise e

        except Exception as e:
            logger.info(f"Failed to create the user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create the user. Please try again.",
            ) from e
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.info(f"Failed to connect to the database.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to connect to the database. Please try again.",
        ) from e


@app.post("/signin", response_model=TokenResponse)
async def signin(form_data: SigninRequest):
    try:
        conn = await get_db_connection()
        user = await conn.fetchrow(
            "SELECT * FROM users WHERE phone_number = $1", form_data.phone
        )
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"errors": {"form": ["Invalid phone number or password"]}},
            )

        if not verify_password(form_data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"errors": {"form": ["Invalid phone number or password"]}},
            )

        access_token = create_access_token(
            data={
                "sub": user["phone_number"],
                "user_id": str(user["id"]),
                "role": user["role"],
            }
        )

        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException as e:
        raise e

    except Exception as e:
        logger.error(f"Sign in failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process sign in. Please try again later.",
        )


@app.post("/add_station")
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


@app.post("/add_stop")
async def add_stop(stop_data: RouteStopRequest):
    try:
        conn = await get_db_connection()
        route_id = uuid.UUID(stop_data.route_id)
        station_id = uuid.UUID(stop_data.station_id)
        stop_int = int(stop_data.stop_int)
        try:
            await conn.execute(
                """
                INSERT INTO routes_stations(route_id, station_id, stop_int) VALUES ($1, $2, $3)
                """,
                route_id,
                station_id,
                stop_int,
            )
        except Exception as e:
            logger.error(f"Failed to add stop: {e}")

        return {
            "message": "Successfully added stop",
            "station_id": stop_data.station_id,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to connect to the database. Please try again.",
        ) from e


@app.post("/add_route")
async def add_route(route_data: AddRouteRequest):
    try:
        conn = await get_db_connection()
        route_id = uuid.uuid4()
        start_station_id = uuid.UUID(route_data.start_station_id)
        end_station_id = uuid.UUID(route_data.end_station_id)

        await conn.execute(
            """
            INSERT INTO routes(route_id, route_name, start_station_id, end_station_id) VALUES ($1, $2, $3, $4)
            """,
            route_id,
            route_data.route_name,
            start_station_id,
            end_station_id,
        )

        await conn.execute(
            """
            INSERT INTO routes_stations(route_id, station_id, stop_int) VALUES ($1, $2, $3)
            """,
            route_id,
            start_station_id,
            1,
        )

        return {
            "message": "Add Route Successful",
            "route_id": route_id,
        }

    except Exception as e:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to connect to database. Please try again.",
        ) from e


@app.post("/add_train")
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


## user endpoints gula
@app.get("/users/{user_id}", response_model=UserDetailResponse)
async def get_user(user_id: uuid.UUID):
    try:
        conn = await get_db_connection()
        try:
            user = await conn.fetchrow(
                """
                SELECT u.id, u.name, u.email, u.phone_number, w.balance
                FROM users u
                JOIN wallets w ON u.id = w.user_id
                WHERE u.id = $1
                """,
                user_id,
            )

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
                )

            return UserDetailResponse(
                id=user["id"],
                name=user["name"],
                email=user["email"],
                phone=user["phone_number"],
                wallet=user["balance"],
            )
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error fetching user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch user details. Please try again later.",
            )
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to the database. Please try again later.",
        )


@app.put("/users/{user_id}", response_model=UserDetailResponse)
async def update_user(user_id: uuid.UUID, user_data: UpdateUserRequest):
    try:
        conn = await get_db_connection()
        try:
            # Check if user exists
            existing_user = await conn.fetchrow(
                "SELECT id FROM users WHERE id = $1", user_id
            )

            if not existing_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
                )

            # Check for email and phone uniqueness (excluding current user)
            if user_data.email:
                email_check = await conn.fetchrow(
                    "SELECT id FROM users WHERE email = $1 AND id != $2",
                    user_data.email,
                    user_id,
                )
                if email_check:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={
                            "errors": {
                                "email": ["Email is already in use by another user"]
                            }
                        },
                    )

            phone_check = await conn.fetchrow(
                "SELECT id FROM users WHERE phone_number = $1 AND id != $2",
                user_data.phone,
                user_id,
            )
            if phone_check:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "errors": {
                            "phone": ["Phone number is already in use by another user"]
                        }
                    },
                )

            # Update user details in transaction
            async with conn.transaction():
                # Update user table
                await conn.execute(
                    """
                    UPDATE users 
                    SET name = $1, email = $2, phone_number = $3
                    WHERE id = $4
                    """,
                    user_data.name,
                    user_data.email,
                    user_data.phone,
                    user_id,
                )

                # Update wallet
                await conn.execute(
                    """
                    UPDATE wallets
                    SET balance = $1
                    WHERE user_id = $2
                    """,
                    user_data.wallet,
                    user_id,
                )

                # Add entry to user history
                history_id = uuid.uuid4()
                now = datetime.now()
                await conn.execute(
                    """
                    INSERT INTO user_history (id, user_id, action, date, details)
                    VALUES ($1, $2, $3, $4, $5)
                    """,
                    history_id,
                    user_id,
                    "User Updated",
                    now,
                    f"User details updated: Name={user_data.name}, Email={user_data.email}, Phone={user_data.phone}, Wallet={user_data.wallet}",
                )

            # Get updated user details
            updated_user = await conn.fetchrow(
                """
                SELECT u.id, u.name, u.email, u.phone_number, w.balance
                FROM users u
                JOIN wallets w ON u.id = w.user_id
                WHERE u.id = $1
                """,
                user_id,
            )

            return UserDetailResponse(
                id=updated_user["id"],
                name=updated_user["name"],
                email=updated_user["email"],
                phone=updated_user["phone_number"],
                wallet=updated_user["balance"],
            )

        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error updating user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user. Please try again later.",
            )
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to the database. Please try again later.",
        )


## history endpoint


@app.get("/users/{user_id}/history", response_model=List[UserHistoryEntry])
async def get_user_history(user_id: uuid.UUID):
    try:
        conn = await get_db_connection()
        try:
            # Check if user exists
            user_exists = await conn.fetchrow(
                "SELECT id FROM users WHERE id = $1", user_id
            )

            if not user_exists:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
                )

            # Get user history entries
            rows = await conn.fetch(
                """
                SELECT id, action, date, details 
                FROM user_history
                WHERE user_id = $1
                ORDER BY date DESC
                LIMIT 50
                """,
                user_id,
            )

            history = [
                UserHistoryEntry(
                    id=row["id"],
                    action=row["action"],
                    date=row["date"],
                    details=row["details"],
                )
                for row in rows
            ]

            return history

        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error fetching user history: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch user history. Please try again later.",
            )
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to the database. Please try again later.",
        )


#### FAre FARE
@app.get("/calculate-fare", response_model=FareResponse)
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
