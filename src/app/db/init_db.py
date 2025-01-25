import os

from asyncpg import Connection

from app.utils.logger import logger

from .connection import get_db_connection


async def create_tables(connection: Connection):
    sql_file_path = os.path.join(
        os.path.dirname(__file__), "migrations", "create_user_table.sql"
    )

    with open(sql_file_path, "r") as file:
        create_users_table_sql = file.read()

    try:
        await connection.execute(create_users_table_sql)
        logger.info("User table created successfully")
    except Exception as e:
        logger.error(f"Error creating table: {e}")
        raise e
