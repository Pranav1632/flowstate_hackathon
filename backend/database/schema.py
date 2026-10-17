"""
Database Schema Definitions & Initialization
"""

from backend.database.connection import get_db_connection


CREATE_SCHEMA_SQL = """
    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        manufacturer TEXT NOT NULL,
        category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_lots (
        lot_id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        warehouse_id TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity >= 0),
        status TEXT NOT NULL,
        FOREIGN KEY(product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS shipments (
        id TEXT PRIMARY KEY,
        destination TEXT NOT NULL,
        destination_type TEXT NOT NULL,
        status TEXT NOT NULL,
        tracking_number TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shipment_items (
        shipment_id TEXT NOT NULL,
        lot_id TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        PRIMARY KEY (shipment_id, lot_id),
        FOREIGN KEY(shipment_id) REFERENCES shipments(id),
        FOREIGN KEY(lot_id) REFERENCES inventory_lots(lot_id)
    );

    CREATE TABLE IF NOT EXISTS recall_incidents (
        id TEXT PRIMARY KEY,
        source_reference TEXT NOT NULL,
        lot_id TEXT,
        severity TEXT NOT NULL,
        hazard_description TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(lot_id) REFERENCES inventory_lots(lot_id)
    );

    CREATE TABLE IF NOT EXISTS incident_actions (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        target_id TEXT,
        intent_token TEXT,
        policy_verdict TEXT NOT NULL, -- ALLOWED | HELD | BLOCKED
        execution_status TEXT NOT NULL, -- EXECUTED | PENDING_REVIEW | BLOCKED | FAILED
        reason TEXT NOT NULL,
        actor TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(incident_id) REFERENCES recall_incidents(id)
    );

    CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        target_id TEXT,
        payload TEXT NOT NULL,
        status TEXT NOT NULL, -- PENDING | APPROVED | REJECTED
        reviewer TEXT,
        created_at TEXT NOT NULL,
        decided_at TEXT,
        FOREIGN KEY(incident_id) REFERENCES recall_incidents(id)
    );
"""

DROP_SCHEMA_SQL = """
    DROP TABLE IF EXISTS approvals;
    DROP TABLE IF EXISTS incident_actions;
    DROP TABLE IF EXISTS recall_incidents;
    DROP TABLE IF EXISTS shipment_items;
    DROP TABLE IF EXISTS shipments;
    DROP TABLE IF EXISTS inventory_lots;
    DROP TABLE IF EXISTS products;
"""


def init_db(reset: bool = False):
    """Initializes tables and optionally resets schema."""
    conn = get_db_connection()
    cursor = conn.cursor()

    if reset:
        cursor.executescript(DROP_SCHEMA_SQL)

    cursor.executescript(CREATE_SCHEMA_SQL)
    conn.commit()
    conn.close()
