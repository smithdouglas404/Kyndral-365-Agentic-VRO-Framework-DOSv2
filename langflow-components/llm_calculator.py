"""
Langflow Custom Component: LLM Calculator

Calculates agent attributes using LLM with narrative and sourcing.
NO MORE HARDCODED MATH - LLM calculates with explanation.

Flow: Input Data → LLM Calculator → Result with Narrative → Mem0 Writer
"""

from langflow.custom import CustomComponent
from langflow.field_typing import Data
import requests
from typing import Dict, Any, Optional


class LLMCalculatorComponent(CustomComponent):
    display_name = "LLM Calculator"
    description = "Calculate agent attributes using LLM with narrative + sourcing"
    documentation = "Replaces hardcoded math with LLM-based calculations"

    def build_config(self):
        return {
            "api_url": {
                "display_name": "API URL",
                "info": "Base URL for your API (e.g., http://localhost:5000)",
                "value": "http://localhost:5000"
            },
            "calculation_type": {
                "display_name": "Calculation Type",
                "info": "Type of calculation",
                "options": [
                    "wip-score",
                    "budget-variance",
                    "schedule-delay",
                    "project-health",
                    "resource-utilization",
                    "dependency-health",
                    "value-realization",
                    "custom"
                ],
                "value": "custom"
            },
            "attribute_name": {
                "display_name": "Attribute Name",
                "info": "Name of attribute to calculate (for custom calculations)",
                "required": False
            },
            "attribute_description": {
                "display_name": "Attribute Description",
                "info": "Description of what to calculate (for custom calculations)",
                "multiline": True,
                "required": False
            },
            "input_data": {
                "display_name": "Input Data",
                "info": "JSON object with input data for calculation",
                "required": True
            },
            "context": {
                "display_name": "Context",
                "info": "Optional business context",
                "multiline": True,
                "required": False
            },
            "entity": {
                "display_name": "Entity",
                "info": "Entity for Mem0 storage (e.g., project_123)",
                "required": False
            },
            "source_agent": {
                "display_name": "Source Agent",
                "info": "Agent requesting calculation",
                "value": "langflow"
            }
        }

    def build(
        self,
        api_url: str,
        calculation_type: str,
        input_data: Dict[str, Any],
        attribute_name: Optional[str] = None,
        attribute_description: Optional[str] = None,
        context: Optional[str] = None,
        entity: Optional[str] = None,
        source_agent: str = "langflow"
    ) -> Data:
        """
        Calculate attribute using LLM
        """
        try:
            # Determine endpoint based on calculation type
            if calculation_type == "custom":
                if not attribute_name:
                    raise ValueError("attribute_name required for custom calculations")

                endpoint = "/api/llm-calculator/calculate"
                payload = {
                    "attributeName": attribute_name,
                    "attributeDescription": attribute_description or f"Calculate {attribute_name}",
                    "inputData": input_data,
                    "context": context,
                    "entity": entity,
                    "sourceAgent": source_agent
                }
            else:
                # Use specialized endpoint
                endpoint = f"/api/llm-calculator/{calculation_type}"
                payload = input_data

            # Call LLM calculator API
            response = requests.post(
                f"{api_url}{endpoint}",
                json=payload,
                timeout=30
            )

            response.raise_for_status()
            data = response.json()

            if not data.get("success"):
                raise Exception(f"Calculation failed: {data.get('error', 'Unknown error')}")

            result = data.get("result", {})

            # Extract key information
            value = result.get("value")
            narrative = result.get("narrative", "")
            reasoning = result.get("reasoning", "")
            sources = result.get("sources", [])
            confidence = result.get("confidence", 1.0)

            # Format output for display
            output_text = f"""
## Calculation Result: {attribute_name or calculation_type}

**Value**: {value}

**Narrative**: {narrative}

**Reasoning**: {reasoning}

**Sources**: {", ".join(sources)}

**Confidence**: {confidence * 100:.0f}%
"""

            self.log(f"✅ Calculated {attribute_name or calculation_type}: {value}")

            return Data(
                value={
                    "success": True,
                    "calculation_type": calculation_type,
                    "value": value,
                    "narrative": narrative,
                    "reasoning": reasoning,
                    "sources": sources,
                    "confidence": confidence,
                    "output_text": output_text,
                    "full_result": result
                }
            )

        except Exception as e:
            error_msg = f"LLM Calculator error: {str(e)}"
            self.log(error_msg)

            return Data(
                value={
                    "success": False,
                    "error": str(e),
                    "calculation_type": calculation_type,
                    "output_text": f"Error: {str(e)}"
                }
            )
