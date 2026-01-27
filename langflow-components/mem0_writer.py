"""
Langflow Custom Component: Mem0 Writer

Writes facts to Mem0 memory layer after LLM processing.
This enables learning from interactions and building agent memory.

Flow: User Input → Mem0 Reader → LLM → Mem0 Writer → Response
"""

from langflow.custom import CustomComponent
from langflow.field_typing import Data
import requests
from typing import Optional


class Mem0WriterComponent(CustomComponent):
    display_name = "Mem0 Writer"
    description = "Write facts to Mem0 memory layer after LLM processing"
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
                "info": "Entity to write fact for (e.g., project_123, agent_pmo)",
                "required": True
            },
            "attribute": {
                "display_name": "Attribute",
                "info": "Attribute name (e.g., budget_variance, risk_score)",
                "required": True
            },
            "value": {
                "display_name": "Value",
                "info": "The value to store (can be any type)",
                "required": True
            },
            "source_agent": {
                "display_name": "Source Agent",
                "info": "Agent that produced this fact",
                "value": "langflow"
            },
            "confidence": {
                "display_name": "Confidence",
                "info": "Confidence score (0.0 to 1.0)",
                "value": 1.0
            },
            "narrative": {
                "display_name": "Narrative",
                "info": "Optional human-readable explanation",
                "multiline": True,
                "required": False
            }
        }

    def build(
        self,
        api_url: str,
        entity: str,
        attribute: str,
        value: any,
        source_agent: str = "langflow",
        confidence: float = 1.0,
        narrative: Optional[str] = None
    ) -> Data:
        """
        Write fact to Mem0 memory layer
        """
        try:
            # Prepare fact data
            fact_data = {
                "entity": entity,
                "attribute": attribute,
                "value": value,
                "sourceAgent": source_agent,
                "confidence": confidence
            }

            # If value is a dict and has narrative, or if narrative provided separately
            if narrative:
                fact_data["narrative"] = narrative
            elif isinstance(value, dict) and "narrative" in value:
                fact_data["narrative"] = value["narrative"]

            # Write to Mem0
            response = requests.post(
                f"{api_url}/api/mem0/write-fact",
                json=fact_data,
                timeout=10
            )

            response.raise_for_status()
            data = response.json()

            if not data.get("success"):
                raise Exception(f"Mem0 write failed: {data.get('error', 'Unknown error')}")

            fact = data.get("fact", {})

            self.log(f"✅ Written to Mem0: {entity}/{attribute} = {value}")

            return Data(
                value={
                    "success": True,
                    "fact": fact,
                    "entity": entity,
                    "attribute": attribute,
                    "message": f"Successfully wrote {attribute} to Mem0 for {entity}"
                }
            )

        except Exception as e:
            error_msg = f"Mem0 Writer error: {str(e)}"
            self.log(error_msg)

            return Data(
                value={
                    "success": False,
                    "error": str(e),
                    "entity": entity,
                    "attribute": attribute,
                    "message": error_msg
                }
            )
