import os

from .connection import get_db_connection


def run_migrations():
    sql_file_path = os.path.join(
        os.path.dirname(__file__), "migrations", "create_users_table.sql"
    )

    with open(sql_file_path, "r") as file:
        create_users_table_sql = file.read()

    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        try:
            cursor.execute(create_users_table_sql)
            conn.commit()
            print("Users table created successfully!")
        except Exception as e:
            print(f"Error creating table: {e}")
        finally:
            cursor.close()
            conn.close()


if __name__ == "__main__":
    run_migrations()
