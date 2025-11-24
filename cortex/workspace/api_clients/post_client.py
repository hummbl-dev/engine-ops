import requests
import json

class PostAPIClient:
    """
    A REST API client for managing blog posts.

    This client provides methods to interact with a Post/Blog API,
    allowing creation, retrieval, updating, and deletion of posts.
    It handles HTTP requests using the 'requests' library and provides
    basic error handling for API interactions.
    """

    def __init__(self, base_url: str):
        """
        Initializes the PostAPIClient with the base URL of the API.

        Args:
            base_url (str): The base URL of the REST API (e.g., 'https://api.example.com/v1').
                            The client will append '/posts' to this URL for post-related operations.
        """
        if base_url.endswith('/'):
            base_url = base_url[:-1]  # Remove trailing slash if present
        self.base_url_root = base_url
        self.posts_endpoint = f"{self.base_url_root}/posts"
        self.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        # You can extend headers for authentication (e.g., Authorization) here if needed.

    def _request(self, method: str, url: str, **kwargs) -> dict | list | None:
        """
        Internal helper method to make HTTP requests and handle common errors.

        Args:
            method (str): The HTTP method (e.g., 'GET', 'POST', 'PUT', 'DELETE').
            url (str): The full URL for the request.
            **kwargs: Additional keyword arguments to pass to requests.request (e.g., json, params).

        Returns:
            dict | list | None: The JSON response if successful (dict for single resource, list for collection),
                                an empty dict for 204 No Content, otherwise None.

        Raises:
            requests.exceptions.RequestException: For any network-related errors, timeouts, or
                                                unsuccessful HTTP status codes (4xx, 5xx).
        """
        try:
            response = requests.request(method, url, headers=self.headers, **kwargs)
            response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)

            if response.status_code == 204:  # No Content for successful DELETE often
                return {}
            
            # Attempt to decode JSON, handle cases where response might not have JSON content
            try:
                return response.json()
            except json.JSONDecodeError:
                # If content type is JSON but body is empty or not valid JSON
                if response.text.strip() == "":
                    return {} # Return empty dict for empty success response
                print(f"Warning: Failed to decode JSON from response. Status: {response.status_code}, Content: '{response.text[:200]}...'")
                return None # Or raise an error, depending on desired strictness

        except requests.exceptions.HTTPError as e:
            print(f"HTTP Error for {method} {url}: {e.response.status_code} - {e.response.text}")
            raise
        except requests.exceptions.ConnectionError as e:
            print(f"Connection Error for {method} {url}: {e}")
            raise
        except requests.exceptions.Timeout as e:
            print(f"Timeout Error for {method} {url}: {e}")
            raise
        except requests.exceptions.RequestException as e:
            print(f"An unexpected request error occurred for {method} {url}: {e}")
            raise
        except Exception as e:
            print(f"An unexpected error occurred for {method} {url}: {e}")
            raise

    def get_post(self, post_id: int) -> dict | None:
        """
        Retrieves a single blog post by its ID.

        Args:
            post_id (int): The unique identifier of the post to retrieve.

        Returns:
            dict | None: A dictionary representing the post if found, otherwise None.
                         Raises `requests.exceptions.RequestException` on API error.
        """
        url = f"{self.posts_endpoint}/{post_id}"
        return self._request('GET', url)

    def list_posts(self) -> list[dict] | None:
        """
        Retrieves a list of all blog posts.

        Returns:
            list[dict] | None: A list of dictionaries, each representing a post, if successful.
                               Raises `requests.exceptions.RequestException` on API error.
        """
        url = self.posts_endpoint
        return self._request('GET', url)

    def create_post(self, data: dict) -> dict | None:
        """
        Creates a new blog post.

        Args:
            data (dict): A dictionary containing the new post's data
                         (e.g., {'title': '...', 'body': '...', 'userId': 1}).

        Returns:
            dict | None: A dictionary representing the newly created post (often including its assigned ID).
                         Raises `requests.exceptions.RequestException` on API error.
        """
        url = self.posts_endpoint
        return self._request('POST', url, json=data)

    def update_post(self, post_id: int, data: dict) -> dict | None:
        """
        Updates an existing blog post identified by its ID.

        Args:
            post_id (int): The unique identifier of the post to update.
            data (dict): A dictionary containing the updated post's data.
                         This will typically replace the entire post content (PUT semantics).

        Returns:
            dict | None: A dictionary representing the updated post.
                         Raises `requests.exceptions.RequestException` on API error.
        """
        url = f"{self.posts_endpoint}/{post_id}"
        return self._request('PUT', url, json=data)

    def delete_post(self, post_id: int) -> dict | None:
        """
        Deletes a blog post by its ID.

        Args:
            post_id (int): The unique identifier of the post to delete.

        Returns:
            dict | None: An empty dictionary `{}` on successful deletion (as DELETE often returns 204 No Content).
                         Raises `requests.exceptions.RequestException` on API error.
        """
        url = f"{self.posts_endpoint}/{post_id}"
        return self._request('DELETE', url)