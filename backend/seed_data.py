"""
Seed Data Facade (Backward Compatibility)
Re-exports from backend.database.seed
"""

from backend.database.seed import seed_database, SAMPLE_NOTICES

__all__ = ["seed_database", "SAMPLE_NOTICES"]
