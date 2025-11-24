import requests

class PaymentApiClient:
    """
    A client for interacting with a REST API for payment operations.

    Handles processing payments, refunding payments, and retrieving payment status.
    """

    def __init__(self, base_url, api_key=None):
        """
        Initializes the PaymentApiClient with the base URL of the API.

        Args:
            base_url (str): The base URL of the payment API (e.g., "https://api.example.com/v1").
            api_key (str, optional): An API key for authentication. If provided,
                                     it will be included in the 'Authorization' header.
        """
        if not base_url:
            raise ValueError("base_url cannot be empty.")
        self.base_url = base_url.rstrip('/')
        self.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        if api_key:
            self.headers['Authorization'] = f'Bearer {api_key}'

    def _request(self, method, endpoint, json_data=None, params=None):
        """
        Internal helper method to make HTTP requests.

        Args:
            method (str): The HTTP method (e.g., 'GET', 'POST', 'PUT', 'DELETE').
            endpoint (str): The specific API endpoint path (e.g., 'payments', 'payments/123').
            json_data (dict, optional): Dictionary to be sent as JSON body for POST/PUT/PATCH.
            params (dict, optional): Dictionary of URL query parameters.

        Returns:
            dict: The JSON response from the API.

        Raises:
            requests.exceptions.RequestException: For network-related errors (e.g., connection refused).
            requests.exceptions.HTTPError: For HTTP error responses (4xx or 5xx).
            ValueError: If the response is not valid JSON.
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        try:
            response = requests.request(
                method,
                url,
                json=json_data,
                params=params,
                headers=self.headers
            )
            response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)

            if response.status_code == 204: # No Content
                return {}
            
            return response.json()
        except requests.exceptions.HTTPError as http_err:
            try:
                error_details = http_err.response.json()
            except ValueError:
                error_details = http_err.response.text
            raise requests.exceptions.HTTPError(
                f"HTTP error occurred: {http_err.response.status_code} - {error_details}",
                response=http_err.response
            ) from http_err
        except requests.exceptions.ConnectionError as conn_err:
            raise requests.exceptions.ConnectionError(
                f"Connection error occurred while connecting to {url}: {conn_err}"
            ) from conn_err
        except requests.exceptions.Timeout as timeout_err:
            raise requests.exceptions.Timeout(
                f"Request timed out while connecting to {url}: {timeout_err}"
            ) from timeout_err
        except requests.exceptions.RequestException as req_err:
            raise requests.exceptions.RequestException(
                f"An unexpected request error occurred: {req_err}"
            ) from req_err
        except ValueError as json_err:
            # This handles cases where response.json() fails
            raise ValueError(
                f"Failed to decode JSON response from {url}: {json_err}. Response text: {response.text}"
            ) from json_err

    def process_payment(self, payment_data):
        """
        Processes a new payment by sending payment details to the API.

        Args:
            payment_data (dict): A dictionary containing payment information.
                                 Example: {'amount': 100.50, 'currency': 'USD',
                                           'card_token': 'tok_xyz123', 'description': 'Order #123'}

        Returns:
            dict: The API's response containing details of the processed payment.

        Raises:
            requests.exceptions.RequestException: If the API call fails.
        """
        if not isinstance(payment_data, dict) or not payment_data:
            raise ValueError("payment_data must be a non-empty dictionary.")
        return self._request('POST', 'payments', json_data=payment_data)

    def refund_payment(self, payment_id, refund_data=None):
        """
        Initiates a refund for an existing payment.

        This method assumes the API has an endpoint like `/payments/{id}/refund`
        that accepts a POST request.

        Args:
            payment_id (str): The unique identifier of the payment to be refunded.
            refund_data (dict, optional): Optional dictionary for refund details
                                          (e.g., {'amount': 50.00} for partial refunds).

        Returns:
            dict: The API's response containing details of the refund operation.

        Raises:
            requests.exceptions.RequestException: If the API call fails.
        """
        if not payment_id:
            raise ValueError("payment_id cannot be empty.")
        endpoint = f'payments/{payment_id}/refund'
        return self._request('POST', endpoint, json_data=refund_data)

    def get_payment_status(self, payment_id):
        """
        Retrieves the current status and details of a specific payment.

        Args:
            payment_id (str): The unique identifier of the payment.

        Returns:
            dict: The API's response containing the payment details and status.

        Raises:
            requests.exceptions.RequestException: If the API call fails.
        """
        if not payment_id:
            raise ValueError("payment_id cannot be empty.")
        endpoint = f'payments/{payment_id}'
        return self._request('GET', endpoint)

# Example Usage (assuming a local API running on http://localhost:5000)
# This part is for demonstration and would typically be in a separate script or test file.
if __name__ == '__main__':
    # For demonstration, you might use a mock server or a simple Flask app to test.
    # Example mock server (install Flask: pip install Flask)
    # from flask import Flask, jsonify, request
    # app = Flask(__name__)
    #
    # payments_db = {}
    #
    # @app.route('/v1/payments', methods=['POST'])
    # def create_payment():
    #     data = request.json
    #     if not data or 'amount' not in data or 'currency' not in data:
    #         return jsonify({"error": "Missing required fields"}), 400
    #     import uuid
    #     payment_id = str(uuid.uuid4())
    #     payments_db[payment_id] = {
    #         "id": payment_id,
    #         "amount": data['amount'],
    #         "currency": data['currency'],
    #         "status": "processed",
    #         "description": data.get('description', '')
    #     }
    #     return jsonify(payments_db[payment_id]), 201
    #
    # @app.route('/v1/payments/<payment_id>', methods=['GET'])
    # def get_payment(payment_id):
    #     payment = payments_db.get(payment_id)
    #     if not payment:
    #         return jsonify({"error": "Payment not found"}), 404
    #     return jsonify(payment)
    #
    # @app.route('/v1/payments/<payment_id>/refund', methods=['POST'])
    # def refund_payment_endpoint(payment_id):
    #     payment = payments_db.get(payment_id)
    #     if not payment:
    #         return jsonify({"error": "Payment not found"}), 404
    #     if payment['status'] == 'refunded':
    #         return jsonify({"message": "Payment already refunded"}), 200
    #     payment['status'] = 'refunded'
    #     return jsonify({"message": "Payment refunded successfully", "payment_id": payment_id}), 200
    #
    # # To run this mock server:
    # # if __name__ == '__main__':
    # #     app.run(debug=True, port=5000)

    # Initialize the client
    BASE_URL = "http://localhost:5000/v1" # Adjust if your mock server runs on a different port/path
    API_KEY = "your_secret_api_key" # Replace with your actual API key

    client = PaymentApiClient(BASE_URL, api_key=API_KEY)

    print("--- Testing Payment API Client ---")

    try:
        # 1. Process a Payment
        print("\n--- Processing a new payment ---")
        payment_data = {
            'amount': 150.75,
            'currency': 'EUR',
            'card_token': 'test_card_token_123',
            'description': 'Online purchase'
        }
        new_payment = client.process_payment(payment_data)
        print("Payment processed successfully:")
        print(new_payment)
        payment_id = new_payment.get('id')

        if payment_id:
            # 2. Get Payment Status
            print(f"\n--- Getting status for payment ID: {payment_id} ---")
            status = client.get_payment_status(payment_id)
            print("Payment status retrieved:")
            print(status)

            # 3. Refund Payment
            print(f"\n--- Refunding payment ID: {payment_id} ---")
            refund_response = client.refund_payment(payment_id)
            print("Payment refunded successfully:")
            print(refund_response)

            # 4. Get Payment Status after Refund
            print(f"\n--- Getting status for payment ID: {payment_id} after refund ---")
            status_after_refund = client.get_payment_status(payment_id)
            print("Payment status retrieved after refund:")
            print(status_after_refund)
        else:
            print("Could not get payment_id from processed payment. Skipping status and refund tests.")

    except ValueError as e:
        print(f"Client initialization error: {e}")
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e.response.status_code} - {e.response.text}")
    except requests.exceptions.RequestException as e:
        print(f"Request Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

    print("\n--- Testing Error Handling ---")
    # Test with invalid payment ID
    try:
        print("\nAttempting to get status for a non-existent payment...")
        client.get_payment_status("non_existent_id")
    except requests.exceptions.HTTPError as e:
        print(f"Caught expected HTTP Error: {e.response.status_code} - {e.response.text}")
    except requests.exceptions.RequestException as e:
        print(f"Caught unexpected Request Error: {e}")

    # Test with empty data for process_payment
    try:
        print("\nAttempting to process payment with empty data...")
        client.process_payment({})
    except ValueError as e:
        print(f"Caught expected ValueError for empty payment_data: {e}")
    except requests.exceptions.RequestException as e:
        print(f"Caught unexpected Request Error: {e}")

    # Test with invalid base_url (to demonstrate connection error)
    print("\nAttempting to connect to an invalid base URL (expecting connection error)...")
    try:
        bad_client = PaymentApiClient("http://nonexistent.invalid.url:9999/api")
        bad_client.get_payment_status("any_id")
    except requests.exceptions.ConnectionError as e:
        print(f"Caught expected ConnectionError: {e}")
    except requests.exceptions.RequestException as e:
        print(f"Caught unexpected Request Error: {e}")
    except ValueError as e:
        print(f"Caught unexpected ValueError: {e}")
<ctrl63>