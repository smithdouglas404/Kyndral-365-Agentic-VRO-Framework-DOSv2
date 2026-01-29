from langflow.custom import Component
from langflow.inputs import StrInput, MessageTextInput
from langflow.template import Output
from langflow.schema import Data
import requests
from datetime import datetime

class A2AMessageSenderComponent(Component):
    display_name = "A2A Message Sender"
    description = "Sends agent-to-agent messages for collaboration"
    icon = "message-circle"

    inputs = [
        StrInput(
            name="server_url",
            display_name="Server URL",
            info="Base URL of the server (e.g., http://localhost:5000)",
            value="http://localhost:5000",
            required=True
        ),
        StrInput(
            name="from_agent",
            display_name="From Agent",
            info="Source agent ID",
            options=["pmo", "finops", "vro", "planning", "ocm", "risk", "governance", "tmo"],
            required=True
        ),
        StrInput(
            name="to_agent",
            display_name="To Agent",
            info="Target agent ID",
            options=["pmo", "finops", "vro", "planning", "ocm", "risk", "governance", "tmo"],
            required=True
        ),
        StrInput(
            name="message_type",
            display_name="Message Type",
            info="Type of A2A message",
            options=["alert", "request", "response", "notification", "escalation"],
            value="alert",
            required=True
        ),
        MessageTextInput(
            name="content",
            display_name="Message Content",
            info="Message content or payload",
            required=True
        ),
        StrInput(
            name="priority",
            display_name="Priority",
            info="Message priority",
            options=["critical", "high", "medium", "low"],
            value="medium",
        ),
    ]

    outputs = [
        Output(display_name="Result", name="result", method="send_message"),
    ]

    def send_message(self) -> Data:
        """
        Send A2A message via server API
        """
        try:
            # Call server A2A message endpoint
            response = requests.post(
                f"{self.server_url}/api/a2a/messages",
                json={
                    'from': self.from_agent,
                    'to': self.to_agent,
                    'type': self.message_type,
                    'content': self.content,
                    'priority': self.priority,
                    'timestamp': datetime.now().isoformat()
                },
                timeout=5
            )

            if response.status_code == 200:
                result = {
                    'sent': True,
                    'from_agent': self.from_agent,
                    'to_agent': self.to_agent,
                    'message_type': self.message_type,
                    'status': 'delivered'
                }
                self.status = f"✅ Sent to {self.to_agent}"
            else:
                result = {
                    'sent': False,
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'status': 'failed'
                }
                self.status = f"❌ Failed: {response.status_code}"

            return Data(data=result)

        except Exception as e:
            error_msg = str(e)
            self.status = f"❌ Error: {error_msg}"
            return Data(data={
                'sent': False,
                'error': error_msg,
                'status': 'error'
            })
