import requests
import logging

# Configure logging for better visibility of operations
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class AuthAPIClient:
    """
    A REST API client for handling authentication operations using JWTs.

    This client provides methods for logging in, logging out, refreshing
    access tokens, and verifying tokens against a specified API.
    It manages access and refresh tokens internally using a requests.Session
    for persistent connections and automatic header management.
    """

    def __init__(self, base_url: str):
        """
        Initializes the AuthAPIClient with the base URL of the API.

        Args:
            base_url (str): The base URL of the REST API (e.g., "http://localhost:8000/api").
                            It should end with a trailing slash if endpoints are appended.
        """
        if not base_url.endswith('/'):
            base_url += '/'
        self.base_url = base_url
        self._access_token = None
        self._refresh_token = None
        self._session = requests.Session() # Use a session for persistent headers and connection pooling

        # Define common endpoints relative to the base URL (example: Django REST Framework Simple JWT)
        self.login_endpoint = self.base_url + "token/"  # Endpoint for obtaining new access/refresh token pair
        self.refresh_endpoint = self.base_url + "token/refresh/" # Endpoint for refreshing access token
        self.verify_endpoint = self.base_url + "token/verify/" # Endpoint for verifying an access token
        # Logout endpoint might vary. Assuming a blacklist endpoint for refresh tokens,
        # which is common for invalidating tokens server-side.
        self.logout_endpoint = self.base_url + "token/blacklist/" # Optional: depends on backend implementation

    def _set_tokens(self, access_token: str, refresh_token: str = None):
        """
        Internal method to set the access and refresh tokens.
        Updates the session's Authorization header.

        Args:
            access_token (str): The JWT access token.
            refresh_token (str, optional): The JWT refresh token. Defaults to None.
        """
        self._access_token = access_token
        self._refresh_token = refresh_token
        # Update session headers with the new access token for subsequent requests
        self._session.headers.update({'Authorization': f'Bearer {self._access_token}'})
        logging.info("Tokens have been updated internally.")

    def _clear_tokens(self):
        """
        Internal method to clear the stored access and refresh tokens.
        Removes the Authorization header from the session.
        """
        self._access_token = None
        self._refresh_token = None
        # Remove Authorization header from session
        if 'Authorization' in self._session.headers:
            del self._session.headers['Authorization']
        logging.info("Tokens have been cleared internally.")

    def _request(self, method: str, url: str, **kwargs) -> requests.Response:
        """
        Helper method to make HTTP requests using the internal session and
        handle common exceptions.

        Args:
            method (str): The HTTP method (e.g., "GET", "POST", "PUT", "DELETE").
            url (str): The full URL for the request.
            **kwargs: Additional keyword arguments to pass to requests.Session.request.

        Returns:
            requests.Response: The response object if the request is successful (2xx status code).

        Raises:
            requests.exceptions.RequestException: For any network-related errors (e.g., ConnectionError, Timeout).
            requests.exceptions.HTTPError: For HTTP errors (non-2xx responses).
        """
        try:
            response = self._session.request(method, url, **kwargs)
            response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
            return response
        except requests.exceptions.ConnectionError as e:
            logging.error(f"Connection Error: Could not connect to {url}. Error: {e}")
            raise
        except requests.exceptions.Timeout as e:
            logging.error(f"Timeout Error: Request to {url} timed out. Error: {e}")
            raise
        except requests.exceptions.HTTPError as e:
            logging.error(f"HTTP Error {e.response.status_code} for {url}: {e.response.text}")
            raise
        except requests.exceptions.RequestException as e:
            logging.error(f"An unexpected Request Error occurred for {url}: {e}")
            raise

    @property
    def access_token(self) -> str | None:
        """
        Returns the current access token stored by the client.
        """
        return self._access_token

    @property
    def refresh_token(self) -> str | None:
        """
        Returns the current refresh token stored by the client.
        """
        return self._refresh_token

    def login(self, username: str, password: str) -> dict | None:
        """
        Logs in a user to the API and stores the returned access and refresh tokens.

        Args:
            username (str): The user's username.
            password (str): The user's password.

        Returns:
            dict | None: The JSON response containing tokens on success, None on failure.
        """
        logging.info(f"Attempting to log in user: '{username}'")
        payload = {"username": username, "password": password}
        try:
            response = self._request("POST", self.login_endpoint, json=payload)
            data = response.json()
            access = data.get("access")
            refresh = data.get("refresh")

            if access and refresh:
                self._set_tokens(access_token=access, refresh_token=refresh)
                logging.info(f"User '{username}' logged in successfully.")
                return data
            else:
                logging.error("Login response did not contain expected 'access' and 'refresh' tokens.")
                return None
        except requests.exceptions.RequestException:
            logging.error(f"Failed to log in user: '{username}'. Check credentials and network.")
            return None

    def logout(self) -> bool:
        """
        Logs out the current user by attempting to blacklist the refresh token
        on the server (if `logout_endpoint` is configured) and always clearing
        local tokens.

        Returns:
            bool: True if logout (or local token clearance) was successful, False otherwise.
        """
        if not self._refresh_token:
            logging.info("No refresh token stored. Performing local token clearance only.")
            self._clear_tokens()
            return True

        logging.info("Attempting to log out by blacklisting refresh token on server.")
        payload = {"refresh": self._refresh_token}
        try:
            # Assuming the server expects the refresh token to be blacklisted.
            # Common responses for successful blacklisting are 200 OK or 205 Reset Content.
            response = self._request("POST", self.logout_endpoint, json=payload)
            if response.status_code in [200, 205]:
                logging.info("Refresh token blacklisted successfully on server.")
            else:
                logging.warning(f"Logout endpoint returned unexpected status code: {response.status_code}. "
                                f"Response: {response.text}")
            self._clear_tokens()
            logging.info("User logged out and local tokens cleared.")
            return True
        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to blacklist refresh token on server. Error: {e}. "
                          "Clearing local tokens anyway for security.")
            self._clear_tokens() # Always clear local tokens even if server fails to blacklist
            return False

    def refresh_token(self) -> dict | None:
        """
        Refreshes the access token using the stored refresh token.
        If successful, the new access token (and optionally a new refresh token)
        will replace the old ones internally.

        Returns:
            dict | None: The JSON response containing the new access token on success,
                         None on failure.
        """
        if not self._refresh_token:
            logging.warning("No refresh token available to perform a refresh operation. Please log in first.")
            return None

        logging.info("Attempting to refresh access token.")
        payload = {"refresh": self._refresh_token}
        try:
            response = self._request("POST", self.refresh_endpoint, json=payload)
            data = response.json()
            new_access = data.get("access")
            # Some APIs might return a new refresh token as well, update if present
            new_refresh = data.get("refresh", self._refresh_token)

            if new_access:
                self._set_tokens(access_token=new_access, refresh_token=new_refresh)
                logging.info("Access token refreshed successfully.")
                return data
            else:
                logging.error("Refresh token response did not contain expected 'access' token.")
                # If refresh failed, the old tokens might be invalid. Clear them.
                self._clear_tokens()
                return None
        except requests.exceptions.RequestException:
            logging.error("Failed to refresh access token. Local tokens cleared as they might be invalid.")
            self._clear_tokens() # If refresh fails, tokens are likely invalid.
            return None

    def verify_token(self, token: str) -> bool:
        """
        Verifies if a given access token is valid and not expired against the API.

        Args:
            token (str): The access token string to verify.

        Returns:
            bool: True if the token is valid, False otherwise.
        """
        logging.info("Attempting to verify token.")
        payload = {"token": token}
        try:
            response = self._request("POST", self.verify_endpoint, json=payload)
            # A 200 OK response indicates the token is valid according to DRF Simple JWT
            if response.status_code == 200:
                logging.info("Token is valid.")
                return True
            else:
                # This path should ideally be caught by raise_for_status, but included for clarity
                logging.warning(f"Token verification failed with status code: {response.status_code}. "
                                f"Response: {response.text}")
                return False
        except requests.exceptions.HTTPError as e:
            # Specifically handle 400 Bad Request or 401 Unauthorized for invalid tokens
            if e.response.status_code in [400, 401]:
                logging.info("Token is invalid or expired based on API response.")
            else:
                logging.error(f"HTTP error during token verification: {e.response.status_code} - {e.response.text}")
            return False
        except requests.exceptions.RequestException:
            logging.error("Failed to verify token due to a network or unexpected error.")
            return False