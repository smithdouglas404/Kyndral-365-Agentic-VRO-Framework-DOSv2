from langflow.custom import Component
from langflow.inputs import StrInput, FloatInput, MessageTextInput
from langflow.template import Output
from langflow.schema import Data

class ThresholdEvaluatorComponent(Component):
    display_name = "Threshold Evaluator"
    description = "Checks if attribute value crosses threshold and fires signal"
    icon = "alert-triangle"

    inputs = [
        StrInput(
            name="attribute_key",
            display_name="Attribute Key",
            info="The attribute being evaluated (e.g., wip_age, flow_efficiency)",
            required=True
        ),
        FloatInput(
            name="current_value",
            display_name="Current Value",
            info="Current value of the attribute",
            required=True
        ),
        StrInput(
            name="operator",
            display_name="Operator",
            info="Comparison operator",
            options=["gt", "lt", "gte", "lte", "eq", "ne"],
            value="gt",
            required=True
        ),
        FloatInput(
            name="threshold",
            display_name="Threshold Value",
            info="Threshold to compare against",
            required=True
        ),
        StrInput(
            name="signal_type",
            display_name="Signal Type",
            info="Type of signal to fire if threshold crossed",
            required=True
        ),
        StrInput(
            name="severity",
            display_name="Severity",
            info="Signal severity level",
            options=["critical", "warning", "info"],
            value="warning",
            required=True
        ),
        StrInput(
            name="agent_id",
            display_name="Agent ID",
            info="ID of the agent that owns this attribute",
            required=True
        ),
        MessageTextInput(
            name="message_template",
            display_name="Message Template",
            info="Message template (use {value}, {threshold}, {attribute})",
            value="{attribute} is {value}, threshold is {threshold}",
        ),
    ]

    outputs = [
        Output(display_name="Signal", name="signal", method="evaluate_threshold"),
    ]

    def evaluate_threshold(self) -> Data:
        """
        Evaluate if threshold is crossed and return signal data
        """
        current = float(self.current_value)
        threshold = float(self.threshold)
        crossed = False

        # Evaluate based on operator
        if self.operator == 'gt':
            crossed = current > threshold
        elif self.operator == 'lt':
            crossed = current < threshold
        elif self.operator == 'gte':
            crossed = current >= threshold
        elif self.operator == 'lte':
            crossed = current <= threshold
        elif self.operator == 'eq':
            crossed = current == threshold
        elif self.operator == 'ne':
            crossed = current != threshold

        # Build message
        message = self.message_template.format(
            attribute=self.attribute_key,
            value=current,
            threshold=threshold
        )

        result = {
            'fire_signal': crossed,
            'signal_type': self.signal_type,
            'attribute': self.attribute_key,
            'current_value': current,
            'threshold': threshold,
            'severity': self.severity,
            'agent_id': self.agent_id,
            'message': message,
            'operator': self.operator,
            'crossed': crossed,
        }

        self.status = message
        return Data(data=result)
