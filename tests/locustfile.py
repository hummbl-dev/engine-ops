from locust import HttpUser, task, between

class SovereignUser(HttpUser):
    wait_time = between(1, 2)

    @task(3)
    def chat_tier_1(self):
        self.client.post("/ignite", json={
            "provider": "gemini", 
            "prompt": "Status Report", 
            "context": "load_test"
        })

    @task(1)
    def workflow_tier_2(self):
        # Simulates heavier load
        self.client.post("/ignite", json={
            "provider": "openai", 
            "prompt": "Analyze complex pattern", 
            "context": "stress_test"
        })
