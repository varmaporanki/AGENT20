import os
import decimal
import datetime
from uuid import UUID
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool
from contextlib import contextmanager
from .scoring_sql import get_scoring_view_sql

DB_NAME = os.getenv("DB_NAME", "acadagents")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))

_pool = None

def get_pool():
    global _pool
    if _pool is None:
        _pool = SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
    return _pool

def serialize_row(obj):
    if isinstance(obj, decimal.Decimal):
        return float(obj)
    if isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    if isinstance(obj, UUID):
        return str(obj)
    if isinstance(obj, dict):
        return {k: serialize_row(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [serialize_row(v) for v in obj]
    return obj

@contextmanager
def get_db_cursor():
    pool = get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Ensure the session-scoped temporary scoring view exists on this connection
            # Checking if the view exists in pg_temp
            cur.execute("""
                SELECT 1 FROM information_schema.views 
                WHERE table_name = 'v_step3b_scoring_engine';
            """)
            if not cur.fetchone():
                cur.execute(get_scoring_view_sql())
            yield cur
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)
