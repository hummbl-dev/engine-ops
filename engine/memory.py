import sqlite3
from datetime import datetime

class PersistenceLayer:
    def __init__(self, db_path="cortex/memory.db"):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        # WAL Mode for performance
        self.conn.execute("PRAGMA journal_mode=WAL;")
        self.create_schema()

    def create_schema(self):
        query = """
        CREATE TABLE IF NOT exists logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME,
            provider TEXT,
            prompt TEXT,
            response TEXT
        )
        """
        self.conn.execute(query)
        self.conn.commit()

    def log_interaction(self, provider, prompt, response):
        self.conn.execute(
            "INSERT INTO logs (timestamp, provider, prompt, response) VALUES (?, ?, ?, ?)",
            (datetime.utcnow(), provider, prompt, response)
        )
        self.conn.commit()
