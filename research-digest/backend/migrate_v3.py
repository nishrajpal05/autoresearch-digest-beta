# backend/migrate_usage.py
import sqlite3
conn = sqlite3.connect("./autoresearch.db")
cursor = conn.cursor()
cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        date TEXT NOT NULL,
        count INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, action, date)
    )
""")
conn.commit()
conn.close()
print(" Usage table created.")