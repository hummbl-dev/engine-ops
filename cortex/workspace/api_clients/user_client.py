import requests

class UserAPIClient:
    """
    A REST API client for managing User operations.

    This client provides methods to interact with a user-focused API,
    allowing retrieval, listing, creation, updating, and deletion of user resources.
    """

    def __init__(self, base_url, api_key=None):
        """
        Initializes the UserAPIClient.

        Args:
            base_url (str): The base URL of the API (e.g., "https://api.example.com/v1").
            api_key (str, optional): An API key for authentication, if required.
                                     It will be sent as a 'Authorization: Bearer <api_key>' header.
        """
        self.base_url = base_url.rstrip('/') + '/users'  # Ensure base_url ends with / and points to users endpoint
        self.headers = {'Content-Type': 'application/json'}
        if api_key:
            self.headers['Authorization'] = f'Bearer {api_key}'

    def _request(self, method, url, data=None):
        """
        Internal helper method to make an HTTP request.

        Args:
            method (str): The HTTP method (e.g., 'GET', 'POST', 'PUT', 'DELETE').
            url (str): The full URL for the request.
            data (dict, optional): The JSON payload for POST/PUT requests.

        Returns:
            dict or list: The JSON response from the API, or None if the response is empty.

        Raises:
            requests.exceptions.RequestException: For network-related errors.
            requests.exceptions.HTTPError: For HTTP errors (4xx or 5xx responses).
        """
        try:
            if data:
                response = requests.request(method, url, headers=self.headers, json=data)
            else:
                response = requests.request(method, url, headers=self.headers)

            response.raise_for_status()  # Raise an HTTPError for bad responses (4xx or 5xx)

            if response.status_code == 204:  # No Content
                return None
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise
        except requests.exceptions.HTTPError as e:
            print(f"HTTP Error: {e.response.status_code} - {e.response.text}")
            raise

    def get_user(self, user_id):
        """
        Retrieves a single user by their ID.

        Args:
            user_id (int or str): The ID of the user to retrieve.

        Returns:
            dict: A dictionary representing the user data.

        Raises:
            requests.exceptions.RequestException: If the request fails.
        """
        url = f"{self.base_url}/{user_id}"
        return self._request('GET', url)

    def list_users(self):
        """
        Retrieves a list of all users.

        Returns:
            list: A list of dictionaries, each representing a user.

        Raises:
            requests.exceptions.RequestException: If the request fails.
        """
        url = self.base_url
        return self._request('GET', url)

    def create_user(self, data):
        """
        Creates a new user.

        Args:
            data (dict): A dictionary containing the user data (e.g., {'name': 'John Doe', 'email': 'john@example.com'}).

        Returns:
            dict: A dictionary representing the newly created user data, including its ID.

        Raises:
            requests.exceptions.RequestException: If the request fails.
        """
        url = self.base_url
        return self._request('POST', url, data=data)

    def update_user(self, user_id, data):
        """
        Updates an existing user.

        Args:
            user_id (int or str): The ID of the user to update.
            data (dict): A dictionary containing the fields to update (e.g., {'email': 'new_email@example.com'}).
                         Only the fields provided will be updated (partial update).

        Returns:
            dict: A dictionary representing the updated user data.

        Raises:
            requests.exceptions.RequestException: If the request fails.
        """
        url = f"{self.base_url}/{user_id}"
        return self._request('PUT', url, data=data)

    def delete_user(self, user_id):
        """
        Deletes a user by their ID.

        Args:
            user_id (int or str): The ID of the user to delete.

        Returns:
            None: If the deletion is successful (typically returns a 204 No Content).

        Raises:
            requests.exceptions.RequestException: If the request fails.
        """
        url = f"{self.base_url}/{user_id}"
        return self._request('DELETE', url)