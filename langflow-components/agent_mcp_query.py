"""
Langflow Custom Component: Agent MCP Query

Queries agent's connected MCPs for knowledge + governance validation.

Flow: Agent Action → MCP Query → Governance validates → Knowledge provides data → Result

Example:
[Agent Decision] → [Agent MCP Query] → [If blocked: Stop] → [If allowed: Continue]
"""

from langflow.custom import CustomComponent
from langflow.field_typing import Data
import requests
from typing import Dict, Any


class AgentMcpQueryComponent(CustomComponent):
    display_name = "Agent MCP Query"
    description = "Query agent's connected MCPs (Knowledge + Governance)"
    documentation = "Enables agents to query MCPs with governance validation"

    def build_config(self):
        return {
            "api_url": {
                "display_name": "API URL",
                "info": "Base URL for your API (e.g., http://localhost:5000)",
                "value": "http://localhost:5000"
            },
            "agent_id": {
                "display_name": "Agent ID",
                "info": "Agent querying MCPs (e.g., finops, pmo, risk)",
                "required": True
            },
            "operation": {
                "display_name": "Operation",
                "info": "Operation to perform",
                "value": "query"
            },
            "input_data": {
                "display_name": "Input Data",
                "info": "JSON object with query data",
                "required": True
            },
            "context": {
                "display_name": "Context",
                "info": "Optional context for query",
                "multiline": True,
                "required": False
            }
        }

    def build(
        self,
        api_url: str,
        agent_id: str,
        operation: str,
        input_data: Dict[str, Any],
        context: str = ""
    ) -> Data:
        """
        Query agent's connected MCPs (Knowledge + Governance)
        """
        try:
            # Call Agent MCP Service
            response = requests.post(
                f"{api_url}/api/agent-mcp/query",
                json={
                    "agentId": agent_id,
                    "operation": operation,
                    "input": input_data,
                    "context": context or None
                },
                timeout=30
            )

            response.raise_for_status()
            data = response.json()

            if not data.get("success"):
                raise Exception(f"MCP query failed: {data.get('error', 'Unknown error')}")

            result = data.get("result", {})

            # Extract results
            knowledge_results = result.get("knowledgeResults", [])
            governance_results = result.get("governanceResults", [])
            final_decision = result.get("finalDecision", "allow")
            blocked_by = result.get("blockedBy", [])
            warnings = result.get("warnings", [])

            # Format output
            output_lines = [f"# Agent MCP Query Result: {agent_id}\n"]

            # Governance Results
            output_lines.append("## Governance Validation:\n")
            for gov in governance_results:
                decision_icon = {
                    'allow': '✅',
                    'block': '❌',
                    'warn': '⚠️'
                }.get(gov['decision'], '❓')

                output_lines.append(
                    f"{decision_icon} **{gov['source']}**: {gov['decision'].upper()}\n"
                    f"  Reason: {gov['reason']}\n"
                )

                if gov.get('recommendations'):
                    output_lines.append("  Recommendations:\n")
                    for rec in gov['recommendations']:
                        output_lines.append(f"  - {rec}\n")

            # Knowledge Results
            if final_decision != 'block':
                output_lines.append("\n## Knowledge Results:\n")
                for know in knowledge_results:
                    cache_status = "📦 (cached)" if know.get('cached') else "🔄 (fresh)"
                    output_lines.append(
                        f"{cache_status} **{know['source']}**: {know.get('executionTime', 0)}ms\n"
                    )

            # Final Decision
            output_lines.append(f"\n## Final Decision: {final_decision.upper()}\n")

            if blocked_by:
                output_lines.append(f"**Blocked by**: {', '.join(blocked_by)}\n")

            if warnings:
                output_lines.append("**Warnings**:\n")
                for warn in warnings:
                    output_lines.append(f"- {warn}\n")

            output_text = "".join(output_lines)

            # Determine if workflow should continue
            should_continue = final_decision in ['allow', 'warn']

            self.log(f"{'✅' if should_continue else '❌'} Agent {agent_id} MCP query: {final_decision}")

            return Data(
                value={
                    "success": True,
                    "agent_id": agent_id,
                    "final_decision": final_decision,
                    "should_continue": should_continue,
                    "knowledge_results": knowledge_results,
                    "governance_results": governance_results,
                    "blocked_by": blocked_by,
                    "warnings": warnings,
                    "output_text": output_text
                }
            )

        except Exception as e:
            error_msg = f"Agent MCP Query error: {str(e)}"
            self.log(error_msg)

            return Data(
                value={
                    "success": False,
                    "error": str(e),
                    "agent_id": agent_id,
                    "final_decision": "block",
                    "should_continue": False,
                    "output_text": f"❌ Error: {str(e)}"
                }
            )
