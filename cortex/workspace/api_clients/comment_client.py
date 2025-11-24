import requests

class CommentAPIClient:
    """
    A REST API client for managing comment operations.

    This client provides methods to interact with a comment API endpoint,
    supporting creation, retrieval, listing, and deletion of comments.
    It uses the `requests` library for HTTP communication and a session
    for persistent connection and header management.
    """

    def __init__(self, base_url: str):
        """
        Initializes the CommentAPIClient with the base URL of the API.

        Args:
            base_url (str): The base URL for the comment API (e.g., "http://localhost:8000/api/v1").
                            Endpoints will be appended to this URL (e.g., "/comments").
        """
        if not base_url.endswith('/'):
            base_url += '/'
        self.base_url = base_url
        self.session = requests.Session()
        # You might want to add default headers here, e.g., for authentication or content type
        # self.session.headers.update({"Authorization": "Bearer YOUR_TOKEN"})
        # self.session.headers.update({"Accept": "application/json"})

    def _get_url(self, path: str = "") -> str:
        """
        Constructs the full URL for an API endpoint.

        Args:
            path (str): The specific path segment for the endpoint (e.g., "comments" or "comments/1").

        Returns:
            str: The full URL.
        """
        # Ensure path does not have a leading slash if base_url already ends with a slash
        if path.startswith('/'):
            path = path[1:]
        return f"{self.base_url}{path}"

    def get_comment(self, comment_id: int) -> dict:
        """
        Retrieves a single comment by its ID.

        Args:
            comment_id (int): The ID of the comment to retrieve.

        Returns:
            dict: A dictionary representing the retrieved comment.

        Raises:
            requests.exceptions.HTTPError: If an HTTP error occurs (e.g., 404 Not Found, 500 Server Error).
            requests.exceptions.RequestException: If a network or connection error occurs.
        """
        url = self._get_url(f"comments/{comment_id}")
        response = self.session.get(url)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
        return response.json()

    def list_comments(self) -> list:
        """
        Retrieves a list of all comments.

        Returns:
            list: A list of dictionaries, where each dictionary represents a comment.

        Raises:
            requests.exceptions.HTTPError: If an HTTP error occurs.
            requests.exceptions.RequestException: If a network or connection error occurs.
        """
        url = self._get_url("comments")
        response = self.session.get(url)
        response.raise_for_status()
        return response.json()

    def create_comment(self, data: dict) -> dict:
        """
        Creates a new comment.

        Args:
            data (dict): A dictionary containing the data for the new comment.
                         Example: {"author": "Jane Doe", "content": "Enjoyed reading this!"}

        Returns:
            dict: A dictionary representing the newly created comment, typically including its ID.

        Raises:
            requests.exceptions.HTTPError: If an HTTP error occurs (e.g., 400 Bad Request, 500 Server Error).
            requests.exceptions.RequestException: If a network or connection error occurs.
        """
        url = self._get_url("comments")
        # requests automatically sets Content-Type: application/json when using the 'json' parameter
        response = self.session.post(url, json=data)
        response.raise_for_status()
        return response.json()

    def delete_comment(self, comment_id: int) -> bool:
        """
        Deletes a comment by its ID.

        Args:
            comment_id (int): The ID of the comment to delete.

        Returns:
            bool: True if the comment was successfully deleted.

        Raises:
            requests.exceptions.HTTPError: If an HTTP error occurs (e.g., 404 Not Found, 403 Forbidden).
            requests.exceptions.RequestException: If a network or connection error occurs.
        """
        url = self._get_url(f"comments/{comment_id}")
        response = self.session.delete(url)
        response.raise_for_status()
        # A successful DELETE often returns 200 OK with content or 204 No Content
        return True