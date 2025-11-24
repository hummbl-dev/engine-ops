import logging
from engine.providers import generate_content
from engine.memory import PersistenceLayer

# The Kernel
class SovereignEngine:
    def __init__(self):
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger("SovereignEngine")
        self.memory = PersistenceLayer()
        self.logger.info("Engine Initialized. Grid Locked.")

    def process_signal(self, provider, input_signal, context=""):
        self.logger.info(f"Processing signal via {provider}...")
        try:
            output = generate_content(provider, input_signal, context)
            # Persist the interaction
            self.memory.log_interaction(provider, input_signal, output)
            return {"status": "success", "payload": output}
        except Exception as e:
            self.logger.error(f"Signal lost: {e}")
            return {"status": "error", "payload": str(e)}
