from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # App
    app_name: str = "Adaptive AI Assistant"
    app_version: str = "0.1.0"
    debug: bool = False
    environment: str = "development"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    allowed_origins: list[str] = ["http://localhost:3000"]

    # Database
    database_url: str = ""

    # OpenAI
    openai_api_key: str = ""

    # Anthropic
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-6"
    anthropic_max_tokens: int = 4096

    # Search (Phase 7)
    tavily_api_key: str = ""
    search_cache_ttl_hours: int = 6

    # MCP Servers (Phase 7)
    mcp_google_calendar_enabled: bool = False
    mcp_github_enabled: bool = False
    mcp_notion_enabled: bool = False
    mcp_gmail_enabled: bool = False
    mcp_web_search_enabled: bool = True
    github_token: str = ""
    notion_token: str = ""

    # LangGraph
    langgraph_recursion_limit: int = 25
    langgraph_checkpoint_enabled: bool = False

    # Feature flags
    enable_web_search: bool = True
    enable_learning_mode: bool = True
    enable_mcp: bool = True
    learning_candidates_count: int = 3
    memory_update_threshold: int = 5


@lru_cache
def get_settings() -> Settings:
    return Settings()
