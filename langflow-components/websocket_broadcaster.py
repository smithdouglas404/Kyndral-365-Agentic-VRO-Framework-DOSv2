from langflow.custom import Component
from langflow.inputs import StrInput, MessageTextInput
from langflow.template import Output
from langflow.schema import Data
import requests
import json

class WebSocketBroadcasterComponent(Component):
    display_name = "WebSocket Broadcaster"
    description = "Broadcasts signal to dashboards via WebSocket"
    icon = "radio"

    inputs = [
        StrInput(
            name="server_url",
            display_name="Server URL",
            info="Base URL of the server (e.g., http://localhost:5000)",
            value="http://localhost:5000",
            required=True
        ),
        StrInput(
            name="channel",
            display_name="Channel",
            info="WebSocket channel to broadcast to",
            required=True
        ),
        StrInput(
            name="event",
            display_name="Event Type",
            info="Event type name",
            value="agent:signal",
            required=True
        ),
        MessageTextInput(
            name="payload",
            display_name="Payload (JSON)",
            info="Event payload as JSON string",
            required=True
        ),
    ]

    outputs = [
        Output(display_name="Result", name="result", method="broadcast_signal"),
    ]

    def broadcast_signal(self) -> Data:
        """
        Broadcast signal via WebSocket to server
        """
        try:
            # Parse payload if it's a string
            if isinstance(self.payload, str):
                try:
                    payload_data = json.loads(self.payload)
                except json.JSONDecodeError:
                    payload_data = {'message': self.payload}
            else:
                payload_data = self.payload

            # Call server WebSocket broadcast endpoint
            response = requests.post(
                f"{self.server_url}/api/websocket/broadcast",
                json={
                    'channel': self.channel,
                    'event': self.event,
                    'payload': payload_data
                },
                timeout=5
            )

            if response.status_code == 200:
                result = {
                    'broadcasted': True,
                    'channel': self.channel,
                    'event': self.event,
                    'status': 'success'
                }
                self.status = f"✅ Broadcasted to {self.channel}"
            else:
                result = {
                    'broadcasted': False,
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'status': 'failed'
                }
                self.status = f"❌ Broadcast failed: {response.status_code}"

            return Data(data=result)

        except Exception as e:
            error_msg = str(e)
            self.status = f"❌ Error: {error_msg}"
            return Data(data={
                'broadcasted': False,
                'error': error_msg,
                'status': 'error'
            })
