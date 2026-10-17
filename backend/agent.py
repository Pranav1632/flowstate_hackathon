"""
Recall Agent Facade (Backward Compatibility)
Re-exports from backend.services.agent
"""

from backend.services.agent.orchestrator import RecallAgent, agent
from backend.services.agent.llm_client import llm_client
from backend.services.agent.prompt_builder import RECALL_PARSER_SYSTEM_PROMPT, parse_extraction_response

__all__ = ["RecallAgent", "agent", "llm_client", "RECALL_PARSER_SYSTEM_PROMPT", "parse_extraction_response"]
