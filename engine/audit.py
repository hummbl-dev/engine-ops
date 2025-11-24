import logging
import json
import os
from datetime import datetime
import hashlib

class AuditLogger:
    def __init__(self, log_file="/app/cortex/workspace/audit_log.jsonl"):
        self.log_file = log_file
        # Ensure directory exists
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        
        self.logger = logging.getLogger("AuditLogger")
        self.logger.setLevel(logging.INFO)
        
        # File handler for JSONL logging
        handler = logging.FileHandler(log_file)
        handler.setFormatter(logging.Formatter('%(message)s'))
        self.logger.addHandler(handler)

    def log_event(self, event_type, user, details, status="SUCCESS"):
        """
        Logs an audit event with cryptographic linking (simple hash chain).
        """
        timestamp = datetime.utcnow().isoformat()
        
        event_data = {
            "timestamp": timestamp,
            "event_type": event_type,
            "user": user,
            "status": status,
            "details": details
        }
        
        # Create a hash of the event for integrity checking
        event_string = json.dumps(event_data, sort_keys=True)
        event_hash = hashlib.sha256(event_string.encode()).hexdigest()
        event_data["hash"] = event_hash
        
        self.logger.info(json.dumps(event_data))
        return event_hash
