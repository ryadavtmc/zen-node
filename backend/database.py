# =============================================================================
# ZenNode Backend — SQLite Database Layer
#
# Manages the local SQLite database (zennode.db) that stores all session
# data on the developer's machine. Replaces the previous JSON file system.
#
# Design principles:
#   - Single file database (zennode.db) next to the backend code
#   - WAL mode for better read concurrency
#   - Context manager for automatic commit/rollback
#   - Configurable path via ZENNODE_DB_PATH env var
# =============================================================================

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

# ── Database path ─────────────────────────────────────────────────────────────
_DB_PATH = Path(
    os.environ.get("ZENNODE_DB_PATH", str(Path(__file__).parent / "zennode.db"))
)

# ── Schema ────────────────────────────────────────────────────────────────────
_SCHEMA = """
    -- One row per coding session (reset creates a new session)
    CREATE TABLE IF NOT EXISTS sessions (
        session_id        TEXT    PRIMARY KEY,
        started_at        TEXT    NOT NULL,
        ended_at          TEXT,                   -- NULL = currently active
        avg_score         REAL    DEFAULT 0,
        max_score         REAL    DEFAULT 0,
        min_score         REAL    DEFAULT 100,
        snapshot_count    INTEGER DEFAULT 0,
        overload_count    INTEGER DEFAULT 0,
        theme_shifts      INTEGER DEFAULT 0,
        flow_seconds      REAL    DEFAULT 0,
        friction_seconds  REAL    DEFAULT 0,
        fatigue_seconds   REAL    DEFAULT 0,
        overload_seconds  REAL    DEFAULT 0,
        ema_score         REAL,                   -- persisted scorer EMA for seamless resume
        synced_to_cloud   INTEGER DEFAULT 0       -- 0 = local only, 1 = synced (Phase 2)
    );

    -- One row per 30s behavioral snapshot
    CREATE TABLE IF NOT EXISTS timeline_entries (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id    TEXT    NOT NULL,
        timestamp     TEXT    NOT NULL,
        score         REAL    NOT NULL,
        state         TEXT    NOT NULL,
        theme_shift   INTEGER NOT NULL DEFAULT 0,
        switch_rate   REAL    DEFAULT 0,
        error_rate    REAL    DEFAULT 0,
        undo_rate     REAL    DEFAULT 0,
        idle_ratio    REAL    DEFAULT 0,
        paste_ratio   REAL    DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
    );

    CREATE INDEX IF NOT EXISTS idx_timeline_session
        ON timeline_entries(session_id);

    CREATE INDEX IF NOT EXISTS idx_timeline_timestamp
        ON timeline_entries(timestamp);

    -- Key-value store for local app settings (anonymous_id, cloud auth, sync toggle)
    CREATE TABLE IF NOT EXISTS app_settings (
        key   TEXT PRIMARY KEY,
        value TEXT
    );
"""


def init_db() -> None:
    """
    Create all tables and indexes if they don't exist.
    Safe to call on every startup — idempotent.
    """
    with get_connection() as conn:
        conn.executescript(_SCHEMA)
    print(f"   🗄️  Database ready: {_DB_PATH}")


@contextmanager
def get_connection():
    """
    Context manager that yields an open SQLite connection.
    Automatically commits on success, rolls back on exception.

    Usage:
        with get_connection() as conn:
            conn.execute("INSERT INTO ...")
    """
    conn = sqlite3.connect(str(_DB_PATH))
    conn.row_factory = sqlite3.Row                 # rows behave like dicts
    conn.execute("PRAGMA journal_mode=WAL")        # better concurrent reads
    conn.execute("PRAGMA foreign_keys=ON")         # enforce FK constraints
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()




# =============================================================================
# ZenNode Backend — SQLite Database Layer
#
# Manages the local SQLite database (zennode.db) that stores all session
# data on the developer's machine. Replaces the previous JSON file system.
#
# Design principles:
#   - Single file database (zennode.db) next to the backend code
#   - WAL mode for better read concurrency
#   - Context manager for automatic commit/rollback
#   - Configurable path via ZENNODE_DB_PATH env var
# =============================================================================

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

# ── Database path ─────────────────────────────────────────────────────────────
_DB_PATH = Path(
    os.environ.get("ZENNODE_DB_PATH", str(Path(__file__).parent / "zennode.db"))
)

# ── Schema ────────────────────────────────────────────────────────────────────
_SCHEMA = """
    -- One row per coding session (reset creates a new session)
    CREATE TABLE IF NOT EXISTS sessions (
        session_id        TEXT    PRIMARY KEY,
        started_at        TEXT    NOT NULL,
        ended_at          TEXT,                   -- NULL = currently active
        avg_score         REAL    DEFAULT 0,
        max_score         REAL    DEFAULT 0,
        min_score         REAL    DEFAULT 100,
        snapshot_count    INTEGER DEFAULT 0,
        overload_count    INTEGER DEFAULT 0,
        theme_shifts      INTEGER DEFAULT 0,
        flow_seconds      REAL    DEFAULT 0,
        friction_seconds  REAL    DEFAULT 0,
        fatigue_seconds   REAL    DEFAULT 0,
        overload_seconds  REAL    DEFAULT 0,
        ema_score         REAL,                   -- persisted scorer EMA for seamless resume
        synced_to_cloud   INTEGER DEFAULT 0       -- 0 = local only, 1 = synced (Phase 2)
    );

    -- One row per 30s behavioral snapshot
    CREATE TABLE IF NOT EXISTS timeline_entries (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id    TEXT    NOT NULL,
        timestamp     TEXT    NOT NULL,
        score         REAL    NOT NULL,
        state         TEXT    NOT NULL,
        theme_shift   INTEGER NOT NULL DEFAULT 0,
        switch_rate   REAL    DEFAULT 0,
        error_rate    REAL    DEFAULT 0,
        undo_rate     REAL    DEFAULT 0,
        idle_ratio    REAL    DEFAULT 0,
        paste_ratio   REAL    DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
    );

    CREATE INDEX IF NOT EXISTS idx_timeline_session
        ON timeline_entries(session_id);

    CREATE INDEX IF NOT EXISTS idx_timeline_timestamp
        ON timeline_entries(timestamp);

    -- Key-value store for local app settings (anonymous_id, cloud auth, sync toggle)
    CREATE TABLE IF NOT EXISTS app_settings (
        key   TEXT PRIMARY KEY,
        value TEXT
    );
"""


def init_db() -> None:
    """
    Create all tables and indexes if they don't exist.
    Safe to call on every startup — idempotent.
    """
    with get_connection() as conn:
        conn.executescript(_SCHEMA)
    print(f"   🗄️  Database ready: {_DB_PATH}")


@contextmanager
def get_connection():
    """
    Context manager that yields an open SQLite connection.
    Automatically commits on success, rolls back on exception.

    Usage:
        with get_connection() as conn:
            conn.execute("INSERT INTO ...")
    """
    conn = sqlite3.connect(str(_DB_PATH))
    conn.row_factory = sqlite3.Row                 # rows behave like dicts
    conn.execute("PRAGMA journal_mode=WAL")        # better concurrent reads
    conn.execute("PRAGMA foreign_keys=ON")         # enforce FK constraints
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


