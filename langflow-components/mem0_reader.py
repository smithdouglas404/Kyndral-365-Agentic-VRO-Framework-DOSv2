"""
Langflow Custom Component: Mem0 Reader

Reads facts from Mem0 memory layer before processing with LLM.
This enables contextual, personalized agent responses.

Flow: User Input → Mem0 Reader → Inject Context → LLM → Mem0 Writer
"""

from langflow.custom import CustomComponent
from langflow.field_typing import Data
import requests
from typing import List, Dict, Any


class Mem0ReaderComponent(CustomComponent):
    display_name = "Mem0 Reader"
    description = "Read facts from Mem0 memory layer to provide context to LLM"
    documentation = "https://docs.mem0.ai"

    def build_config(self):
        return {
            "api_url": {
                "display_name": "API URL",
                "info": "Base URL for your API (e.g., http://localhost:5000)",
                "value": "http://localhost:5000"
            },
            "entity": {
                "display_name": "Entity",
                "info": "Entity to read facts for (e.g., project_123, agent_pmo)",
                "required": True
            },
            "attributes": {
                "display_name": "Attributes",
                "info": "Comma-separated list of attributes to read (leave empty for all)",
                "multiline": False,
                "required": False
            },
            "limit": {
                "display_name": "Limit",
                "info": "Maximum number of facts to retrieve",
                "value": 10
            },
            "semantic_query": {
                "display_name": "Semantic Query",
                "info": "Optional semantic search query for relevant facts",
                "multiline": True,
                "required": False
            }
        }

    def build(
        self,
        api_url: str,
        entity: str,
        attributes: str = "",
        limit: int = 10,
        semantic_query: str = ""
    ) -> Data:
        """
        Read facts from Mem0 and return as context for LLM
        """
        try:
            # If semantic query provided, use semantic search
            if semantic_query:
                response = requests.post(
                    f"{api_url}/api/mem0/semantic-search",
                    json={
                        "query": semantic_query,
                        "entity": entity,
                        "limit": limit
                    },
                    timeout=10
                )
            else:
                # Otherwise, read specific attributes or all facts
                params = {"entity": entity, "limit": limit}
                if attributes:
                    params["attributes"] = attributes

                response = requests.get(
                    f"{api_url}/api/mem0/read-facts",
                    params=params,
                    timeout=10
                )

            response.raise_for_status()
            data = response.json()

            if not data.get("success"):
                raise Exception(f"Mem0 read failed: {data.get('error', 'Unknown error')}")

            facts = data.get("facts", [])

            # Format facts as context string for LLM
            context_lines = [f"# Context from Mem0 Memory ({entity}):\n"]

            for fact in facts:
                attr = fact.get("attribute", "unknown")
                value = fact.get("value", "N/A")
                source = fact.get("sourceAgent", "unknown")
                timestamp = fact.get("timestamp", "")

                context_lines.append(
                    f"- **{attr}**: {value} (from {source} at {timestamp})"
                )

            context = "\n".join(context_lines)

            return Data(
                value={
                    "context": context,
                    "facts": facts,
                    "entity": entity,
                    "count": len(facts)
                }
            )

        except Exception as e:
            self.log(f"Mem0 Reader error: {str(e)}")
            # Return empty context on error
            return Data(
                value={
                    "context": f"# No context available (Mem0 error: {str(e)})",
                    "facts": [],
                    "entity": entity,
                    "count": 0,
                    "error": str(e)
                }
            )
