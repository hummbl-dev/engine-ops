import re

class Guardrails:
    def __init__(self):
        self.forbidden_patterns = [
            (r"AWS_ACCESS_KEY_ID", "Potential AWS Key leak"),
            (r"-----BEGIN RSA PRIVATE KEY-----", "SSH Private Key leak"),
            (r"DROP TABLE", "Destructive SQL command"),
            (r"rm -rf /", "Destructive filesystem command"),
            (r"eval\(", "Unsafe code execution (eval)"),
        ]

    def validate_prompt(self, prompt):
        """
        Scans prompt for policy violations.
        Returns (is_valid, reason)
        """
        # Example: Prevent asking for secrets
        if "ignore all previous instructions" in prompt.lower():
             return False, "Prompt Injection Attempt Detected"
        return True, None

    def validate_output(self, content):
        """
        Scans generated content for policy violations.
        Returns (is_valid, reason)
        """
        for pattern, reason in self.forbidden_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                return False, f"Policy Violation: {reason}"
        return True, None
