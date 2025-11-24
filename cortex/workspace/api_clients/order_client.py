import requests

class OrderApiClient:
    def __init__(self, base_url, api_key=None):
        """
        Initializes the OrderApiClient.

        Args:
            base_url (str): The base URL of the Order API (e.g., "https://api.example.com/v1").
            api_key (str, optional): API key for authentication, if required.
        """
        self.base_url = base_url.rstrip('/')
        self.headers = {'Content-Type': 'application/json'}
        if api_key:
            self.headers['Authorization'] = f'Bearer {api_key}'

    def _request(self, method, endpoint, data=None, params=None):
        """
        Internal helper method to make HTTP requests.

        Args:
            method (str): HTTP method (e.g., 'GET', 'POST', 'PUT', 'DELETE').
            endpoint (str): The API endpoint relative to the base URL (e.g., '/orders').
            data (dict, optional): Dictionary of data to send in the request body (for POST, PUT, PATCH).
            params (dict, optional): Dictionary of query parameters to send with the request.

        Returns:
            dict or list: JSON response from the API. Returns an empty dict if the response
                          has no content (e.g., 204 No Content).

        Raises:
            requests.exceptions.RequestException: For network-related errors (connection, timeout, etc.).
            requests.exceptions.HTTPError: For HTTP status codes indicating an error (4xx or 5xx).
        """
        url = f"{self.base_url}{endpoint}"
        try:
            if data:
                response = requests.request(method, url, headers=self.headers, json=data, params=params)
            else:
                response = requests.request(method, url, headers=self.headers, params=params)

            response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)

            # Check if content exists before trying to parse JSON,
            # as some successful responses (e.g., DELETE) might return 204 No Content.
            if response.content:
                return response.json()
            else:
                return {} # Return empty dict for no content response
        except requests.exceptions.HTTPError as e:
            print(f"HTTP error occurred: {e.response.status_code} - {e.response.text}")
            raise
        except requests.exceptions.ConnectionError as e:
            print(f"Connection error occurred: {e}")
            raise
        except requests.exceptions.Timeout as e:
            print(f"Request timed out: {e}")
            raise
        except requests.exceptions.RequestException as e:
            print(f"An unexpected request error occurred: {e}")
            raise

    def get_order(self, order_id):
        """
        Retrieves a single order by its ID.

        Args:
            order_id (str): The ID of the order to retrieve.

        Returns:
            dict: Dictionary containing the order details.
        """
        endpoint = f"/orders/{order_id}"
        return self._request('GET', endpoint)

    def list_orders(self, **kwargs):
        """
        Retrieves a list of all orders, optionally filtered by query parameters.

        Args:
            **kwargs: Arbitrary keyword arguments to be passed as query parameters
                      (e.g., status='pending', limit=10, customer_id='xyz').

        Returns:
            list: A list of dictionaries, each representing an order.
        """
        endpoint = "/orders"
        return self._request('GET', endpoint, params=kwargs)

    def create_order(self, data):
        """
        Creates a new order.

        Args:
            data (dict): Dictionary containing the order details
                         (e.g., {'items': [{'product_id': 'P1', 'quantity': 2}], 'customer_id': 'C1'}).

        Returns:
            dict: Dictionary containing the details of the newly created order, often including its ID.
        """
        endpoint = "/orders"
        return self._request('POST', endpoint, data=data)

    def cancel_order(self, order_id):
        """
        Cancels an existing order by its ID.

        This implementation assumes a DELETE request marks the order as cancelled or
        removes it from active status. Alternative API designs might use a PATCH
        request to update the order's status to 'cancelled', or a POST request
        to a specific cancellation endpoint like `/orders/{id}/cancel`.

        Args:
            order_id (str): The ID of the order to cancel.

        Returns:
            dict: Dictionary confirming the cancellation or updated order status.
                  May return an empty dict if the API responds with 204 No Content.
        """
        endpoint = f"/orders/{order_id}"
        return self._request('DELETE', endpoint)

    def get_order_status(self, order_id):
        """
        Retrieves the status of a specific order by its ID.

        This assumes a dedicated endpoint for fetching just the status.
        For example: GET /orders/{id}/status.
        If the full order details (from `get_order`) already include the status,
        this method could be simplified to extract it from `get_order`.

        Args:
            order_id (str): The ID of the order.

        Returns:
            dict: Dictionary containing the order status (e.g., {'status': 'shipped'}).
        """
        endpoint = f"/orders/{order_id}/status"
        return self._request('GET', endpoint)