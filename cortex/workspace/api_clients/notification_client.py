import requests
from typing import Optional, Dict, Any

class NotificationClient:
    """
    A REST API client for handling various notification operations.

    This class provides methods to send email, SMS, and push notifications
    by interacting with a predefined notification service API.
    It uses the `requests` library for HTTP communication.
    """

    def __init__(self, base_url: str, api_key: Optional[str] = None):
        """
        Initializes the NotificationClient with the base URL of the notification API.

        Args:
            base_url (str): The base URL for the notification service API
                            (e.g., 'https://api.example.com/notifications').
                            It should not end with a slash.
            api_key (str, optional): An API key for authentication, if required by the service.
                                      If provided, it will be sent as a 'Bearer' token
                                      in the 'Authorization' header. Defaults to None.
        """
        self.base_url = base_url.rstrip('/')
        self.headers: Dict[str, str] = {
            "Content-Type": "application/json"
        }
        if api_key:
            self.headers['Authorization'] = f'Bearer {api_key}'

    def _make_request(self, method: str, endpoint: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Internal helper method to make HTTP requests to the notification API.

        This method centralizes error handling and response parsing.

        Args:
            method (str): The HTTP method (e.g., 'POST').
            endpoint (str): The API endpoint relative to the base URL (e.g., 'email', 'sms').
            data (dict, optional): The JSON payload to send with the request. Defaults to None.

        Returns:
            dict: A dictionary containing the JSON response from the API.
                  If an error occurs, it returns a dictionary with 'status' set to 'error'
                  and a 'message' describing the error, potentially including API details.
        """
        url = f"{self.base_url}/{endpoint}"
        try:
            response = requests.request(method, url, json=data, headers=self.headers)
            response.raise_for_status()  # Raise an HTTPError for bad responses (4xx or 5xx)
            return response.json()
        except requests.exceptions.HTTPError as e:
            # Attempt to return API's error message if available
            try:
                error_details = e.response.json()
            except requests.exceptions.JSONDecodeError:
                error_details = {"raw_response": e.response.text}
            return {
                "status": "error",
                "message": f"API responded with status {e.response.status_code}",
                "details": error_details
            }
        except requests.exceptions.ConnectionError as e:
            return {"status": "error", "message": f"Connection Error: Could not connect to {url}. {e}"}
        except requests.exceptions.Timeout as e:
            return {"status": "error", "message": f"Timeout Error: The request to {url} timed out. {e}"}
        except requests.exceptions.RequestException as e:
            return {"status": "error", "message": f"An unexpected request error occurred: {e}"}
        except Exception as e:
            return {"status": "error", "message": f"An unexpected error occurred: {e}"}

    def send_email(self, to: str, subject: str, body: str) -> Dict[str, Any]:
        """
        Sends an email notification via the API.

        Args:
            to (str): The recipient's email address.
            subject (str): The subject line of the email.
            body (str): The HTML or plain text content of the email.

        Returns:
            dict: A dictionary containing the API response (e.g., success message or error details).
                  Example success: {"status": "success", "message": "Email sent successfully."}
                  Example error: {"status": "error", "message": "...", "details": {...}}
        """
        endpoint = "email"  # Assumes an API endpoint like /notifications/email
        payload = {
            "to": to,
            "subject": subject,
            "body": body
        }
        return self._make_request("POST", endpoint, payload)

    def send_sms(self, phone: str, message: str) -> Dict[str, Any]:
        """
        Sends an SMS message via the API.

        Args:
            phone (str): The recipient's phone number (e.g., '+1234567890').
            message (str): The text content of the SMS.

        Returns:
            dict: A dictionary containing the API response (e.g., success message or error details).
                  Example success: {"status": "success", "message": "SMS sent successfully."}
                  Example error: {"status": "error", "message": "...", "details": {...}}
        """
        endpoint = "sms"  # Assumes an API endpoint like /notifications/sms
        payload = {
            "phone": phone,
            "message": message
        }
        return self._make_request("POST", endpoint, payload)

    def send_push(self, user_id: str, message: str) -> Dict[str, Any]:
        """
        Sends a push notification to a specific user via the API.

        Args:
            user_id (str): The unique identifier for the user to receive the push notification.
            message (str): The content of the push notification.

        Returns:
            dict: A dictionary containing the API response (e.g., success message or error details).
                  Example success: {"status": "success", "message": "Push notification sent."}
                  Example error: {"status": "error", "message": "...", "details": {...}}
        """
        endpoint = "push"  # Assumes an API endpoint like /notifications/push
        payload = {
            "user_id": user_id,
            "message": message
        }
        return self._make_request("POST", endpoint, payload)