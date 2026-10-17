"""
RecallGuard Database Facade (Backward Compatibility)
Re-exports from backend.database
"""

from backend.database.connection import (
    get_db_connection,
    row_to_dict,
    rows_to_dicts,
    DB_FILE,
)
from backend.database.schema import init_db

__all__ = [
    "get_db_connection",
    "row_to_dict",
    "rows_to_dicts",
    "init_db",
    "DB_FILE",
]
