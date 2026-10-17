"""
Database Connection Manager
Provides thread-safe SQLite connection handles with busy-timeout handling.
"""

import sqlite3
import os
from typing import Dict, Any, List, Optional
from backend.core.config import settings

DB_FILE = settings.DB_PATH


def get_db_connection() -> sqlite3.Connection:
    """Returns an active SQLite connection with row_factory enabled and busy timeout."""
    conn = sqlite3.connect(DB_FILE, check_same_thread=False, timeout=20.0)
    conn.row_factory = sqlite3.Row
    return conn


def row_to_dict(row: Optional[sqlite3.Row]) -> Optional[Dict[str, Any]]:
    """Converts a SQLite Row into a standard dictionary."""
    if row is None:
        return None
    return dict(row)


def rows_to_dicts(rows: List[sqlite3.Row]) -> List[Dict[str, Any]]:
    """Converts a list of SQLite Rows into standard dictionaries."""
    return [dict(r) for r in rows]
