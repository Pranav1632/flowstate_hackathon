"""
LLM Client Wrapper
Manages connection to Google Gemini 3.8 Flash with fallback to local Ollama.
"""

import httpx
from typing import Optional
from google import genai
from backend.core.config import settings


class LLMClient:
    def __init__(self):
        self.gemini_client: Optional[genai.Client] = None
        if settings.GEMINI_API_KEY:
            try:
                self.gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception as e:
                print(f"[LLMClient] Notice initializing Gemini client: {e}")

    def generate_json(self, prompt: str, system_prompt: str) -> str:
        """Invokes primary LLM (Gemini 3.8 Flash) with fallback to local Ollama Qwen 2.5."""
        # 1. Primary: Gemini API
        if self.gemini_client:
            try:
                response = self.gemini_client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=f"{system_prompt}\n\nTask:\n{prompt}",
                    config={"response_mime_type": "application/json"}
                )
                return response.text.strip()
            except Exception as e:
                print(f"[LLMClient] Gemini call error ({e}), attempting local Ollama fallback...")

        # 2. Secondary: Ollama Local Qwen 2.5
        try:
            with httpx.Client(timeout=2.0) as client:
                res = client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "system": system_prompt,
                        "prompt": prompt,
                        "format": "json",
                        "stream": False
                    }
                )
                if res.status_code == 200:
                    return res.json().get("response", "{}")
        except Exception as e:
            print(f"[LLMClient] Ollama fallback error: {e}")

        # 3. Graceful safety fallback to deterministic clinical parser
        print("[LLMClient] Both Gemini and Ollama unavailable; using resilient clinical parser.")
        return ""


llm_client = LLMClient()
