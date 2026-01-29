from langflow.custom import Component
from langflow.inputs import StrInput, MessageTextInput
from langflow.template import Output
from langflow.schema import Data
import json
from datetime import datetime

class AttributeMapperComponent(Component):
    display_name = "Attribute Mapper"
    description = "Maps MCP data to agent attributes"
    icon = "git-branch"

    inputs = [
        StrInput(
            name="agent_type",
            display_name="Agent Type",
            info="Type of agent (pmo, finops, vro, etc.)",
            options=["pmo", "finops", "vro", "planning", "ocm", "risk", "governance", "tmo", "company"],
            required=True
        ),
        MessageTextInput(
            name="mcp_data",
            display_name="MCP Data (JSON)",
            info="Data from MCP server as JSON",
            required=True
        ),
        StrInput(
            name="entity_id",
            display_name="Entity ID",
            info="Entity identifier (e.g., project_123, feature_456)",
        ),
    ]

    outputs = [
        Output(display_name="Attributes", name="attributes", method="map_attributes"),
    ]

    def map_attributes(self) -> Data:
        """
        Map MCP data to agent-specific attributes
        """
        try:
            # Parse MCP data
            if isinstance(self.mcp_data, str):
                data = json.loads(self.mcp_data)
            else:
                data = self.mcp_data

            attributes = []

            # Map based on agent type
            if self.agent_type == 'pmo':
                attributes = self._map_pmo_attributes(data)
            elif self.agent_type == 'finops':
                attributes = self._map_finops_attributes(data)
            elif self.agent_type == 'planning':
                attributes = self._map_planning_attributes(data)
            elif self.agent_type == 'risk':
                attributes = self._map_risk_attributes(data)
            # Add more agent types as needed

            result = {
                'agent_type': self.agent_type,
                'entity_id': self.entity_id,
                'attributes': attributes,
                'count': len(attributes),
                'timestamp': datetime.now().isoformat()
            }

            self.status = f"✅ Mapped {len(attributes)} attributes for {self.agent_type}"
            return Data(data=result)

        except Exception as e:
            error_msg = str(e)
            self.status = f"❌ Mapping error: {error_msg}"
            return Data(data={
                'agent_type': self.agent_type,
                'attributes': [],
                'error': error_msg
            })

    def _map_pmo_attributes(self, data: dict) -> list:
        """Map Jira/Azure DevOps data to PMO attributes"""
        attributes = []

        # Example: Jira issue mapping
        if 'issue' in data:
            issue = data['issue']

            # Feature UUID
            attributes.append({
                'key': 'feature_uuid',
                'value': issue.get('key'),
                'confidence': 1.0
            })

            # Story points
            story_points = issue.get('fields', {}).get('customfield_10016', 0)
            if story_points:
                attributes.append({
                    'key': 'estimated_story_points',
                    'value': story_points,
                    'confidence': 1.0
                })

            # Flow status
            status = issue.get('fields', {}).get('status', {}).get('name', '')
            flow_status = self._map_jira_status_to_flow(status)
            attributes.append({
                'key': 'flow_status',
                'value': flow_status,
                'confidence': 1.0
            })

            # WIP age (if in progress)
            if status == 'In Progress':
                created = issue.get('fields', {}).get('created')
                if created:
                    wip_age = self._calculate_wip_age(created)
                    attributes.append({
                        'key': 'wip_age',
                        'value': wip_age,
                        'confidence': 1.0
                    })

        return attributes

    def _map_finops_attributes(self, data: dict) -> list:
        """Map SAP/financial data to FinOps attributes"""
        attributes = []

        # Example: SAP budget data
        if 'budget' in data:
            attributes.append({
                'key': 'allocated_budget',
                'value': data['budget'].get('allocated'),
                'confidence': 1.0
            })

            attributes.append({
                'key': 'actual_spend_to_date',
                'value': data['budget'].get('actual'),
                'confidence': 1.0
            })

        return attributes

    def _map_planning_attributes(self, data: dict) -> list:
        """Map planning/dependency data to Planning attributes"""
        attributes = []

        if 'dependencies' in data:
            attributes.append({
                'key': 'total_dependencies',
                'value': len(data['dependencies']),
                'confidence': 1.0
            })

            blocked = [d for d in data['dependencies'] if d.get('blocked')]
            attributes.append({
                'key': 'blocked_dependencies',
                'value': len(blocked),
                'confidence': 1.0
            })

        return attributes

    def _map_risk_attributes(self, data: dict) -> list:
        """Map risk data to Risk attributes"""
        attributes = []

        if 'risk_score' in data:
            attributes.append({
                'key': 'overall_risk_score',
                'value': data['risk_score'],
                'confidence': 1.0
            })

        return attributes

    def _map_jira_status_to_flow(self, status: str) -> str:
        """Map Jira status to SAFe flow status"""
        mapping = {
            'Backlog': 'Backlog',
            'To Do': 'Analyzing',
            'In Progress': 'Implementing',
            'Code Review': 'Validating',
            'Done': 'Done',
            'Closed': 'Done'
        }
        return mapping.get(status, 'Backlog')

    def _calculate_wip_age(self, created_date: str) -> int:
        """Calculate WIP age in days"""
        try:
            from datetime import datetime
            created = datetime.fromisoformat(created_date.replace('Z', '+00:00'))
            now = datetime.now(created.tzinfo)
            age_days = (now - created).days
            return age_days
        except:
            return 0
