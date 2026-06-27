"""
MCP Router — Model Context Protocol tool integration hub.

Routes LangGraph nodes to the appropriate MCP server based on
intent detected by the Task Analyzer.

Supported MCP servers (Phase 7+):
  - web-search     : Tavily web search
  - google-calendar: Calendar queries and scheduling
  - github         : Repository info, PRs, issues
  - notion         : Page creation and retrieval
  - gmail          : Email reading and drafting

Each MCP server is independently configurable and can be
enabled/disabled via feature flags in settings.
"""
from __future__ import annotations

from enum import Enum
from dataclasses import dataclass


class MCPServer(str, Enum):
    WEB_SEARCH = "web-search"
    GOOGLE_CALENDAR = "google-calendar"
    GITHUB = "github"
    NOTION = "notion"
    GMAIL = "gmail"


@dataclass
class MCPToolCall:
    server: MCPServer
    tool: str
    arguments: dict


@dataclass
class MCPResult:
    server: MCPServer
    tool: str
    content: str
    success: bool
    error: str | None = None


# Mapping from intent signals → MCP servers
INTENT_SERVER_MAP: dict[str, list[MCPServer]] = {
    "calendar": [MCPServer.GOOGLE_CALENDAR],
    "schedule": [MCPServer.GOOGLE_CALENDAR],
    "meeting": [MCPServer.GOOGLE_CALENDAR],
    "github": [MCPServer.GITHUB],
    "repository": [MCPServer.GITHUB],
    "pull request": [MCPServer.GITHUB],
    "pr": [MCPServer.GITHUB],
    "notion": [MCPServer.NOTION],
    "note": [MCPServer.NOTION],
    "email": [MCPServer.GMAIL],
    "gmail": [MCPServer.GMAIL],
    "news": [MCPServer.WEB_SEARCH],
    "search": [MCPServer.WEB_SEARCH],
    "latest": [MCPServer.WEB_SEARCH],
    "current": [MCPServer.WEB_SEARCH],
    "documentation": [MCPServer.WEB_SEARCH],
}


def detect_required_tools(user_message: str, task_type: str) -> list[MCPServer]:
    """Determine which MCP servers are needed for a given request."""
    message_lower = user_message.lower()
    servers: set[MCPServer] = set()

    for signal, mcp_servers in INTENT_SERVER_MAP.items():
        if signal in message_lower:
            servers.update(mcp_servers)

    return list(servers)


# Phase 7 will implement actual MCP client connections
async def call_mcp_tool(tool_call: MCPToolCall) -> MCPResult:
    raise NotImplementedError("MCP tool execution will be implemented in Phase 7")


async def route_and_execute(
    user_message: str,
    task_analysis: dict,
) -> list[MCPResult]:
    """Route to relevant MCP servers and collect results."""
    raise NotImplementedError("MCP Router execution will be implemented in Phase 7")
