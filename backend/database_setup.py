# backend/database_setup.py
import sqlite3
conn = sqlite3.connect('analyzer.db')
cursor = conn.cursor()
cursor.execute('''
    CREATE TABLE IF NOT EXISTS analysis_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_description TEXT NOT NULL,
        resume_filename TEXT NOT NULL,
        final_score REAL NOT NULL,
        verdict TEXT,
        identified_skills TEXT,
        found_skills TEXT,
        analysis_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
''')
cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL
    )
''')
print("Database and table created successfully.")
conn.commit()
conn.close()