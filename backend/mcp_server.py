"""
Inventory & Recall MCP Server Facade (Backward Compatibility)
Re-exports from backend.mcp
"""

from backend.mcp.server import InventoryRecallMCP

__all__ = ["InventoryRecallMCP"]
