"""
Langflow Custom Component: Rule Evaluator

Evaluates rules with LLM-calculated variables.
Returns whether condition is met along with calculation narratives.

Flow: Input Data → Rule Evaluator → Condition Met? → Action
"""

from langflow.custom import CustomComponent
from langflow.field_typing import Data
import requests
from typing import Dict, Any, List


class RuleEvaluatorComponent(CustomComponent):
    display_name = "Rule Evaluator"
    description = "Evaluate rules with LLM-calculated variables"
    documentation = "Rules engine with LLM calculations instead of hardcoded formulas"

    def build_config(self):
        return {
            "api_url": {
                "display_name": "API URL",
                "info": "Base URL for your API (e.g., http://localhost:5000)",
                "value": "http://localhost:5000"
            },
            "rule_id": {
                "display_name": "Rule ID",
                "info": "Unique identifier for the rule",
                "required": True
            },
            "rule_name": {
                "display_name": "Rule Name",
                "info": "Human-readable rule name",
                "required": True
            },
            "agent_id": {
                "display_name": "Agent ID",
                "info": "Agent evaluating the rule",
                "required": True
            },
            "entity": {
                "display_name": "Entity",
                "info": "Entity to evaluate (e.g., project_123)",
                "required": True
            },
            "input_data": {
                "display_name": "Input Data",
                "info": "JSON object with data for rule evaluation",
                "required": True
            },
            "variables": {
                "display_name": "Variables",
                "info": "List of variables needed by rule (JSON array)",
                "required": True
            },
            "condition": {
                "display_name": "Condition",
                "info": "Rule condition (JSON object)",
                "required": True
            }
        }

    def build(
        self,
        api_url: str,
        rule_id: str,
        rule_name: str,
        agent_id: str,
        entity: str,
        input_data: Dict[str, Any],
        variables: List[Dict[str, Any]],
        condition: Dict[str, Any]
    ) -> Data:
        """
        Evaluate rule with LLM calculations
        """
        try:
            # Call rule evaluator API
            response = requests.post(
                f"{api_url}/api/llm-calculator/evaluate-rule",
                json={
                    "ruleId": rule_id,
                    "ruleName": rule_name,
                    "agentId": agent_id,
                    "entity": entity,
                    "inputData": input_data,
                    "variables": variables,
                    "condition": condition
                },
                timeout=30
            )

            response.raise_for_status()
            data = response.json()

            if not data.get("success"):
                raise Exception(f"Rule evaluation failed: {data.get('error', 'Unknown error')}")

            result = data.get("result", {})

            condition_met = result.get("conditionMet", False)
            calculated_values = result.get("calculatedValues", {})
            execution_time = result.get("evaluationTime", 0)

            # Format narratives from calculated values
            narratives = []
            for var_name, var_data in calculated_values.items():
                value = var_data.get("value")
                narrative = var_data.get("narrative", "")
                confidence = var_data.get("confidence", 1.0)

                narratives.append(
                    f"**{var_name}**: {value}\n  {narrative} (confidence: {confidence * 100:.0f}%)"
                )

            output_text = f"""
## Rule Evaluation: {rule_name}

**Condition Met**: {'✅ YES' if condition_met else '❌ NO'}

**Execution Time**: {execution_time}ms

### Calculated Values:
{chr(10).join(narratives)}
"""

            self.log(f"{'✅' if condition_met else '❌'} Rule {rule_name}: condition_met={condition_met}")

            return Data(
                value={
                    "success": True,
                    "rule_id": rule_id,
                    "rule_name": rule_name,
                    "condition_met": condition_met,
                    "calculated_values": calculated_values,
                    "execution_time": execution_time,
                    "output_text": output_text,
                    "should_trigger_action": condition_met
                }
            )

        except Exception as e:
            error_msg = f"Rule Evaluator error: {str(e)}"
            self.log(error_msg)

            return Data(
                value={
                    "success": False,
                    "error": str(e),
                    "rule_id": rule_id,
                    "rule_name": rule_name,
                    "condition_met": False,
                    "output_text": f"Error: {str(e)}",
                    "should_trigger_action": False
                }
            )
