import os

import psycopg2

DATABASE_URL = "postgresql://ken_kaneki:autoshyektagoru@localhost:5432/metro_db"


def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        print(f"Successfully connected to database")
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None


if __name__ == "__main__":
    get_db_connection()
