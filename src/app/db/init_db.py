import os

from asyncpg import Connection

from app.utils.logger import logger

from .connection import get_db_connection


async def create_tables(connection: Connection):
    migrations_path = os.path.join(os.path.dirname(__file__), "migrations")
    
    sql_files = [f for f in os.listdir(migrations_path) if f.endswith(".sql")]
    
    for sql_file in sql_files:
        sql_file_path = os.path.join(migrations_path, sql_file)

        try:
            with open(sql_file_path, "r") as file:
                sql_content = file.read()
            
            await connection.execute(sql_content)
            logger.info(f"Executed {sql_file} successfully")
        except Exception as e:
            logger.error(f"Error executing {sql_file}: {e}")
            raise e

        

    