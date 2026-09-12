"""
Agent 20 Multi-Provider AI Fallback Engine
Provides a unified abstraction for LLM narrative synthesis:
Primary Provider: Groq (groq/compound-mini)
Fallback Provider: OpenAI (gpt-4o-mini)

PostgreSQL remains the ONLY authoritative source for research analytics,
scores, rankings, and numerical facts. The AI layer strictly explains
and synthesizes evidence-grounded narratives over database-derived facts.
"""

import os
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, List, Dict, Any
import httpx

logger = logging.getLogger("agent20.ai_provider")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

# Load local backend/.env if not already loaded into os.environ
def _load_env():
    candidates = [
        os.path.join(os.path.dirname(__file__), ".env"),
        os.path.join(os.getcwd(), ".env"),
        os.path.join(os.getcwd(), "backend", ".env")
    ]
    for env_path in candidates:
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("\"'")
                            if k and k not in os.environ:
                                os.environ[k] = v
                break
            except Exception as e:
                logger.debug(f"Could not read env file at {env_path}: {e}")

_load_env()


class ProviderUnavailableError(Exception):
    """Raised when an AI provider is unavailable due to quota, rate limit, timeout, or 5xx."""
    def __init__(self, message: str, status_code: Optional[int] = None, provider: str = ""):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.provider = provider


class AllProvidersUnavailableError(Exception):
    """Raised when all configured AI providers fail."""
    pass


@dataclass
class AIProviderResult:
    text: str
    provider: str
    model: str


class AIProvider(ABC):
    name: str

    @abstractmethod
    def is_configured(self) -> bool:
        """Check if provider has required credentials configured without making network calls."""
        pass

    @abstractmethod
    def generate(self, system_prompt: str, user_prompt: str) -> AIProviderResult:
        """Generate narrative text using the provider."""
        pass


class GroqProvider(AIProvider):
    name = "groq"

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY") or ""
        self.model = os.getenv("GROQ_MODEL", "groq/compound-mini")
        self.timeout = float(os.getenv("AI_TIMEOUT_SECONDS", "15"))

    def is_configured(self) -> bool:
        self.api_key = os.getenv("GROQ_API_KEY") or ""
        return bool(self.api_key and len(self.api_key) > 5)

    def generate(self, system_prompt: str, user_prompt: str) -> AIProviderResult:
        if not self.is_configured():
            raise ProviderUnavailableError("Groq credentials not configured", provider=self.name)

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 1024
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, headers=headers, json=payload)
        except httpx.TimeoutException:
            raise ProviderUnavailableError(f"Groq request timed out after {self.timeout}s", provider=self.name)
        except httpx.NetworkError as ne:
            raise ProviderUnavailableError(f"Groq network connectivity error: {type(ne).__name__}", provider=self.name)
        except Exception as e:
            raise ProviderUnavailableError(f"Groq client error: {str(e)}", provider=self.name)

        if response.status_code == 200:
            try:
                data = response.json()
                choices = data.get("choices", [])
                if not choices:
                    raise ProviderUnavailableError("Groq returned empty choices", status_code=200, provider=self.name)
                message = choices[0].get("message", {})
                text = message.get("content", "").strip()
                if not text:
                    raise ProviderUnavailableError("Groq message content is empty", status_code=200, provider=self.name)
                return AIProviderResult(text=text, provider=self.name, model=self.model)
            except Exception as pe:
                raise ProviderUnavailableError(f"Failed to parse Groq response: {str(pe)}", status_code=200, provider=self.name)
        else:
            status = response.status_code
            if status == 429:
                err_msg = "Groq quota or rate limit exceeded (HTTP 429)"
            elif status in (401, 403):
                err_msg = f"Groq authentication/permission failure (HTTP {status})"
            elif status == 408:
                err_msg = "Groq request timeout (HTTP 408)"
            elif status in (500, 502, 503, 504):
                err_msg = f"Groq upstream server error (HTTP {status})"
            else:
                err_msg = f"Groq provider error (HTTP {status})"
            raise ProviderUnavailableError(err_msg, status_code=status, provider=self.name)


class OpenAIProvider(AIProvider):
    name = "openai"

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY") or ""
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.timeout = float(os.getenv("AI_TIMEOUT_SECONDS", "15"))

    def is_configured(self) -> bool:
        self.api_key = os.getenv("OPENAI_API_KEY") or ""
        return bool(self.api_key and len(self.api_key) > 5)

    def generate(self, system_prompt: str, user_prompt: str) -> AIProviderResult:
        if not self.is_configured():
            raise ProviderUnavailableError("OpenAI credentials not configured", provider=self.name)

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 1024
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, headers=headers, json=payload)
        except httpx.TimeoutException:
            raise ProviderUnavailableError(f"OpenAI request timed out after {self.timeout}s", provider=self.name)
        except httpx.NetworkError as ne:
            raise ProviderUnavailableError(f"OpenAI network connectivity error: {type(ne).__name__}", provider=self.name)
        except Exception as e:
            raise ProviderUnavailableError(f"OpenAI client error: {str(e)}", provider=self.name)

        if response.status_code == 200:
            try:
                data = response.json()
                choices = data.get("choices", [])
                if not choices:
                    raise ProviderUnavailableError("OpenAI returned empty choices", status_code=200, provider=self.name)
                message = choices[0].get("message", {})
                text = message.get("content", "").strip()
                if not text:
                    raise ProviderUnavailableError("OpenAI message content is empty", status_code=200, provider=self.name)
                return AIProviderResult(text=text, provider=self.name, model=self.model)
            except Exception as pe:
                raise ProviderUnavailableError(f"Failed to parse OpenAI response: {str(pe)}", status_code=200, provider=self.name)
        else:
            status = response.status_code
            if status == 429:
                err_msg = "OpenAI quota/credits exhausted or rate limit exceeded (HTTP 429)"
            elif status in (401, 403):
                err_msg = f"OpenAI authentication/permission failure (HTTP {status})"
            elif status == 408:
                err_msg = "OpenAI request timeout (HTTP 408)"
            elif status in (500, 502, 503, 504):
                err_msg = f"OpenAI upstream server error (HTTP {status})"
            else:
                err_msg = f"OpenAI provider error (HTTP {status})"
            raise ProviderUnavailableError(err_msg, status_code=status, provider=self.name)


class AIService:
    """
    Multi-Provider AI Fallback Service Orchestrator
    Manages provider priority and handles seamless automatic fallback.
    Default order: Groq (primary) -> OpenAI (fallback).
    """

    def __init__(self):
        self.providers: Dict[str, AIProvider] = {
            "groq": GroqProvider(),
            "openai": OpenAIProvider()
        }

    def get_priority_order(self) -> List[str]:
        raw_order = os.getenv("AI_PROVIDER_PRIORITY", "groq,openai")
        order = [p.strip().lower() for p in raw_order.split(",") if p.strip().lower() in self.providers]
        return order if order else ["groq", "openai"]

    def generate_narrative(self, system_prompt: str, user_prompt: str) -> AIProviderResult:
        """
        Attempt providers in priority order.
        If the primary provider (Groq) succeeds, immediately return the response.
        If a provider encounters an availability error (quota, timeout, 429, 5xx),
        automatically attempt the next provider in order (OpenAI).
        """
        priority = self.get_priority_order()
        last_error = None

        for provider_name in priority:
            provider = self.providers.get(provider_name)
            if not provider:
                continue

            if not provider.is_configured():
                logger.info("AI Provider [%s] is not configured; skipping to next in priority.", provider_name)
                continue

            try:
                logger.info("Executing AI narrative synthesis with provider [%s]...", provider_name)
                result = provider.generate(system_prompt=system_prompt, user_prompt=user_prompt)
                logger.info("Successfully generated AI narrative with provider [%s].", provider_name)
                return result
            except ProviderUnavailableError as pue:
                logger.warning(
                    "%s unavailable; attempting %s fallback (%s)",
                    provider_name.capitalize(),
                    "OpenAI" if provider_name == "groq" else "next",
                    pue.message
                )
                last_error = pue
                continue
            except Exception as e:
                logger.warning(
                    "%s encountered unexpected error; attempting fallback (%s)",
                    provider_name.capitalize(),
                    str(e)
                )
                last_error = e
                continue

        # If all providers fail:
        logger.error("All AI providers in priority list failed. Last error: %s", last_error)
        raise AllProvidersUnavailableError(
            f"All configured AI providers are temporarily unavailable. Last error: {last_error}"
        )

    def get_status(self) -> Dict[str, Any]:
        """
        Return safe status without exposing any keys, secrets, or making live requests.
        """
        priority = self.get_priority_order()
        return {
            "status": "ready",
            "primary_provider": priority[0] if priority else None,
            "fallback_provider": priority[1] if len(priority) > 1 else None,
            "priority": priority,
            "providers": {
                name: {
                    "configured": p.is_configured(),
                    "model": getattr(p, "model", "default")
                }
                for name, p in self.providers.items()
            }
        }


# Global singleton instance
ai_service = AIService()
