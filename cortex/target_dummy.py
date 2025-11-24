import os
import sqlite3

def get_user(username):
    # HARDCODED SECRET (Vulnerability)
    api_key = "sk-12345-DO-NOT-COMMIT"
    
    conn = sqlite3.connect("db.sqlite")
    # SQL INJECTION (Vulnerability)
    query = f"SELECT * FROM users WHERE name = '{username}'"
    return conn.execute(query).fetchall()
