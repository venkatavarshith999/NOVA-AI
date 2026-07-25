import aiosqlite
import os
import json
import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "nova.db")

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                query TEXT NOT NULL,
                report_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS searches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                query TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        ''')
        await db.commit()

async def save_report(user_id: int | None, query: str, report_json: dict) -> int:
    report_str = json.dumps(report_json)
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute('''
            INSERT INTO reports (user_id, query, report_json)
            VALUES (?, ?, ?)
        ''', (user_id, query, report_str))
        await db.commit()
        return cursor.lastrowid

async def get_reports(user_id: int) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute('SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC', (user_id,)) as cursor:
            rows = await cursor.fetchall()
            return [{"id": row["id"], "user_id": row["user_id"], "query": row["query"], "report_json": json.loads(row["report_json"]), "created_at": row["created_at"]} for row in rows]

async def get_report(report_id: int) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute('SELECT * FROM reports WHERE id = ?', (report_id,)) as cursor:
            row = await cursor.fetchone()
            if row:
                return {"id": row["id"], "user_id": row["user_id"], "query": row["query"], "report_json": json.loads(row["report_json"]), "created_at": row["created_at"]}
            return None

async def delete_report(report_id: int) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('DELETE FROM reports WHERE id = ?', (report_id,))
        await db.commit()
        return True

async def save_user(name: str, email: str, password_hash: str) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute('''
            INSERT INTO users (name, email, password_hash)
            VALUES (?, ?, ?)
        ''', (name, email, password_hash))
        await db.commit()
        return cursor.lastrowid

async def get_user_by_email(email: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute('SELECT * FROM users WHERE email = ?', (email,)) as cursor:
            row = await cursor.fetchone()
            if row:
                return dict(row)
            return None

async def get_user_by_id(user_id: int) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute('SELECT * FROM users WHERE id = ?', (user_id,)) as cursor:
            row = await cursor.fetchone()
            if row:
                return dict(row)
            return None
