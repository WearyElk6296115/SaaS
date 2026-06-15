"""LLM Abstraction Layer

Provides a unified interface for interacting with different LLM providers.
Currently supports OpenAI and Anthropic, with an extensible base class pattern.
"""

from abc import ABC, abstractmethod
from typing import Optional


class BaseLLM(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    async def generate(self, prompt: str, system: Optional[str] = None, **kwargs) -> str:
        """Generate a response from the LLM."""
        ...

    @abstractmethod
    async def generate_structured(self, prompt: str, system: Optional[str] = None, **kwargs) -> str:
        """Generate a structured (JSON) response from the LLM."""
        ...


class OpenAILLM(BaseLLM):
    """OpenAI GPT-4 / GPT-3.5 implementation."""

    def __init__(self, api_key: str, model: str = "gpt-4"):
        self.api_key = api_key
        self.model = model

    async def generate(self, prompt: str, system: Optional[str] = None, **kwargs) -> str:
        # TODO: Implement OpenAI API call via httpx
        raise NotImplementedError

    async def generate_structured(self, prompt: str, system: Optional[str] = None, **kwargs) -> str:
        # TODO: Implement structured output with response_format
        raise NotImplementedError


class AnthropicLLM(BaseLLM):
    """Anthropic Claude implementation."""

    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        self.api_key = api_key
        self.model = model

    async def generate(self, prompt: str, system: Optional[str] = None, **kwargs) -> str:
        # TODO: Implement Anthropic API call via httpx
        raise NotImplementedError

    async def generate_structured(self, prompt: str, system: Optional[str] = None, **kwargs) -> str:
        # TODO: Implement structured output
        raise NotImplementedError


def create_llm(provider: str = "openai", api_key: str = "", model: str = "") -> BaseLLM:
    """Factory function to create the appropriate LLM instance."""
    if provider == "openai":
        return OpenAILLM(api_key=api_key, model=model or "gpt-4")
    elif provider == "anthropic":
        return AnthropicLLM(api_key=api_key, model=model or "claude-3-5-sonnet-20241022")
    else:
        raise ValueError(f"Unknown LLM provider: {provider}")