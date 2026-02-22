import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'codemonster.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("SELECT username, email FROM users")
    rows = cursor.fetchall()
    print("USERS_IN_DB:")
    for row in rows:
        print(f"Username: {row[0]}, Email: {row[1]}")
except Exception as e:
    print(f"DB_ERROR: {str(e)}")
finally:
    conn.close()
