import os
from urllib.parse import urlparse

import asyncpg
from dotenv import load_dotenv

from app.utils.logger import logger

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


async def get_db_connection() -> asyncpg.Connection:
    try:
        if not DATABASE_URL:
            logger.error("DATABASE_URL is not set in the environment variables")
            raise ValueError("DATABASE_URL is not set in the environment variables")

        result = urlparse(DATABASE_URL)
        connection: asyncpg.Connection = await asyncpg.connect(
            database=result.path[1:],
            user=result.username,
            password=result.password,
            host=result.hostname,
            port=result.port,
        )
        logger.info("Successfully connected to database")
        return connection
    except Exception as e:
        logger.error(f"Error connecting to database: {e}")
        raise e


if __name__ == "__main__":
    get_db_connection()
