"""
PostgreSQL database connection pool manager using psycopg3.
Manages connection lifecycle, thread-safe pooling, and health verification.
"""

import logging
from contextlib import contextmanager
from typing import Generator, Optional
import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app.config import get_settings

logger = logging.getLogger("agent20.db")

_pool: Optional[ConnectionPool] = None


def init_db_pool() -> Optional[ConnectionPool]:
    """
    Initializes the psycopg3 connection pool.
    Gracefully handles connection failures so server startup is not blocked if DB is down.
    """
    global _pool
    settings = get_settings()
    if _pool is not None:
        return _pool

    try:
        logger.info(f"Connecting to database at {settings.sanitized_database_url()}...")
        _pool = ConnectionPool(
            conninfo=settings.DATABASE_URL,
            min_size=settings.DB_POOL_MIN_SIZE,
            max_size=settings.DB_POOL_MAX_SIZE,
            timeout=float(settings.DB_TIMEOUT_SECONDS),
            kwargs={"row_factory": dict_row, "autocommit": True},
            open=True,
        )
        logger.info("Database connection pool initialized successfully.")
        return _pool
    except Exception as exc:
        logger.error(f"Failed to initialize database connection pool: {exc}")
        _pool = None
        return None


def close_db_pool() -> None:
    """Closes the psycopg3 connection pool."""
    global _pool
    if _pool is not None:
        try:
            _pool.close()
            logger.info("Database connection pool closed.")
        except Exception as exc:
            logger.warning(f"Error closing database connection pool: {exc}")
        finally:
            _pool = None


def get_db_pool() -> Optional[ConnectionPool]:
    """Returns the current active connection pool or attempts to initialize it."""
    global _pool
    if _pool is None:
        return init_db_pool()
    return _pool


@contextmanager
def get_db_connection() -> Generator[psycopg.Connection, None, None]:
    """
    Context manager yielding a psycopg3 connection from the pool.
    Ensures safe release back to pool upon completion.
    """
    pool = get_db_pool()
    if pool is None:
        raise psycopg.OperationalError("Database connection pool is not available")

    with pool.connection() as conn:
        yield conn


def check_db_health() -> dict:
    """
    Executes a simple probe query (SELECT 1) to verify database connectivity.
    Returns a status dict without exposing credentials or internal traces.
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 AS is_alive;")
                result = cur.fetchone()
                if result and result.get("is_alive") == 1:
                    return {
                        "status": "connected",
                        "database": "acadagents",
                        "message": "PostgreSQL connection healthy",
                    }
                return {
                    "status": "degraded",
                    "database": "acadagents",
                    "message": "Unexpected probe response",
                }
    except Exception as exc:
        logger.warning(f"Database health probe failed: {exc}")
        return {
            "status": "disconnected",
            "database": "acadagents",
            "message": "Unable to connect to PostgreSQL database",
        }
