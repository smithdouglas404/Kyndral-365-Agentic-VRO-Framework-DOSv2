from langflow.custom import Component
from langflow.inputs import StrInput, MessageTextInput
from langflow.template import Output
from langflow.schema import Data
import requests
import json
from datetime import datetime

class DBPersisterComponent(Component):
    display_name = "Database Persister"
    description = "Asynchronously persists agent attributes to database"
    icon = "database"

    inputs = [
        StrInput(
            name="server_url",
            display_name="Server URL",
            info="Base URL of the server (e.g., http://localhost:5000)",
            value="http://localhost:5000",
            required=True
        ),
        StrInput(
            name="agent_id",
            display_name="Agent ID",
            info="ID of the agent (e.g., pmo, finops)",
            required=True
        ),
        StrInput(
            name="entity",
            display_name="Entity ID",
            info="Entity identifier (e.g., project_123)",
            required=True
        ),
        StrInput(
            name="attribute_key",
            display_name="Attribute Key",
            info="Attribute key (e.g., wip_age, flow_efficiency)",
            required=True
        ),
        MessageTextInput(
            name="value",
            display_name="Attribute Value",
            info="Attribute value (can be JSON)",
            required=True
        ),
    ]

    outputs = [
        Output(display_name="Result", name="result", method="persist_to_db"),
    ]

    def persist_to_db(self) -> Data:
        """
        Persist attribute to database via server API
        """
        try:
            # Parse value if it's JSON string
            if isinstance(self.value, str):
                try:
                    value_data = json.loads(self.value)
                except json.JSONDecodeError:
                    value_data = self.value
            else:
                value_data = self.value

            # Call server DB persistence endpoint
            response = requests.post(
                f"{self.server_url}/api/agent-facts",
                json={
                    'agent_id': self.agent_id,
                    'entity': self.entity,
                    'attribute_key': self.attribute_key,
                    'value': value_data,
                    'created_at': datetime.now().isoformat()
                },
                timeout=5
            )

            if response.status_code == 200:
                result = {
                    'persisted': True,
                    'agent_id': self.agent_id,
                    'entity': self.entity,
                    'attribute_key': self.attribute_key,
                    'status': 'success'
                }
                self.status = f"✅ Persisted {self.attribute_key}"
            else:
                result = {
                    'persisted': False,
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'status': 'failed'
                }
                self.status = f"❌ Failed: {response.status_code}"

            return Data(data=result)

        except Exception as e:
            error_msg = str(e)
            self.status = f"❌ Error: {error_msg}"
            return Data(data={
                'persisted': False,
                'error': error_msg,
                'status': 'error'
            })
