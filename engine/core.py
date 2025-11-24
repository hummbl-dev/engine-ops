import logging
import time
from engine.providers import generate_content
from engine.memory import PersistenceLayer
from engine.audit import AuditLogger
from engine.guardrails import Guardrails
from prometheus_client import Counter, Histogram, Gauge

# Prometheus Metrics
ai_requests_total = Counter('ai_requests_total', 'Total AI requests', ['provider', 'status'])
ai_request_duration = Histogram('ai_request_duration_seconds', 'AI request latency', ['provider'])
ai_response_size = Histogram('ai_response_bytes', 'Size of AI-generated responses', ['provider'])
workflow_executions = Counter('workflow_executions_total', 'Workflow executions', ['status'])
active_workflows = Gauge('active_workflows', 'Currently executing workflows')

# The Kernel
class SovereignEngine:
    def __init__(self):
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger("SovereignEngine")
        self.logger = logging.getLogger("SovereignEngine")
        self.memory = PersistenceLayer()
        self.audit = AuditLogger()
        self.guardrails = Guardrails()
        self.logger.info("Engine Initialized. Grid Locked.")

    def process_signal(self, provider, input_signal, context=""):
        self.logger.info(f"Processing signal via {provider}...")
        start_time = time.time()
        
        # 1. Guardrails: Validate Prompt
        is_valid, reason = self.guardrails.validate_prompt(input_signal)
        if not is_valid:
            self.logger.warning(f"Guardrail blocked prompt: {reason}")
            self.audit.log_event("PROMPT_BLOCKED", "system", {"reason": reason, "prompt_snippet": input_signal[:50]}, status="BLOCKED")
            return {"status": "error", "payload": f"Security Policy Violation: {reason}"}

        try:
            output = generate_content(provider, input_signal, context)
            
            # 2. Guardrails: Validate Output
            is_valid, reason = self.guardrails.validate_output(output)
            if not is_valid:
                self.logger.warning(f"Guardrail blocked output: {reason}")
                self.audit.log_event("OUTPUT_BLOCKED", "system", {"reason": reason}, status="BLOCKED")
                return {"status": "error", "payload": f"Security Policy Violation: {reason}"}

            # Record metrics
            duration = time.time() - start_time
            ai_request_duration.labels(provider=provider).observe(duration)
            ai_response_size.labels(provider=provider).observe(len(output))
            ai_requests_total.labels(provider=provider, status='success').inc()
            
            # 3. Audit Log: Success
            self.audit.log_event("GENERATION_SUCCESS", "system", {
                "provider": provider,
                "tokens_estimated": len(output) // 4,
                "duration": duration
            })
            
            # Persist the interaction  
            self.memory.log_interaction(provider, input_signal, output)
            return {"status": "success", "payload": output}
        except Exception as e:
            duration = time.time() - start_time
            ai_request_duration.labels(provider=provider).observe(duration)
            ai_requests_total.labels(provider=provider, status='error').inc()
            
            self.logger.error(f"Signal lost: {e}")
            return {"status": "error", "payload": str(e)}
