"""
RecallGuard API Server
FastAPI application modular bootstrap mounting API routers and lifecycle hooks.
"""

import os
import sys
from pathlib import Path

# Ensure project root is in sys.path so 'backend' package is always resolvable
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from backend.core.config import settings
from backend.database.schema import init_db
from backend.database.connection import get_db_connection, rows_to_dicts, row_to_dict
from backend.database.seed import seed_database, SAMPLE_NOTICES
from backend.mcp.server import InventoryRecallMCP
from backend.services.governance.armoriq_engine import governor
from backend.services.agent.orchestrator import agent

# Routers
from backend.api.routers import (
    incidents_router,
    inventory_router,
    approvals_router,
    governance_router,
    system_router,
)

app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Modular Routers
app.include_router(incidents_router)
app.include_router(inventory_router)
app.include_router(approvals_router)
app.include_router(governance_router)
app.include_router(system_router)


@app.on_event("startup")
def startup_event():
    """Initializes and seeds database on server start if uninitialized."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT count(*) as count FROM products")
    count = cursor.fetchone()["count"]
    conn.close()
    if count == 0:
        seed_database()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
