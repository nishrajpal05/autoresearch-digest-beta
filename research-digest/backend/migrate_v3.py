import sqlite3
conn = sqlite3.connect("./autoresearch.db")
cursor = conn.cursor()

cursor.execute("""
    CREATE TABLE IF NOT EXISTS topic_watches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        topic TEXT NOT NULL,
        keywords TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
""")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS topic_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        topic_watch_id INTEGER NOT NULL,
        paper_id INTEGER NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (topic_watch_id) REFERENCES topic_watches(id),
        FOREIGN KEY (paper_id) REFERENCES papers(id),
        UNIQUE(user_id, topic_watch_id, paper_id)
    )
""")

conn.commit()
conn.close()
print("Topic watching tables created.")