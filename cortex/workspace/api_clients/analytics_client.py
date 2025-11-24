import requests
from requests.exceptions import HTTPError, ConnectionError, Timeout, RequestException
from json.decoder import JSONDecodeError


class AnalyticsAPIClient:
    """
    A Python client for interacting with an Analytics/Metrics REST API.

    This client provides methods to fetch various analytics data such as
    daily statistics, user-specific metrics, and revenue reports.
    It encapsulates API endpoint construction, request execution, and robust error handling.
    """

    def __init__(self, base_url: str):
        """
        Initializes the AnalyticsAPIClient with the base URL of the API.

        Args:
            base_url (str): The base URL of the analytics API (e.g., "http://api.example.com/v1").
                            It should not include a trailing slash, as paths are appended dynamically.

        Raises:
            ValueError: If the base_url is empty.
        """
        if not base_url:
            raise ValueError("Base URL cannot be empty.")
        self.base_url = base_url.rstrip('/')

    def _make_request(self, method: str, path: str, params: dict = None, json_data: dict = None) -> dict:
        """
        Internal helper method to make an HTTP request to the API.

        This method centralizes request logic, error handling, and JSON parsing,
        ensuring consistent behavior across all API calls.

        Args:
            method (str): The HTTP method (e.g., 'GET', 'POST').
            path (str): The API endpoint path relative to the base URL (e.g., "stats/daily").
            params (dict, optional): Dictionary of URL query parameters. Defaults to None.
            json_data (dict, optional): Dictionary of JSON data to send in the request body. Defaults to None.

        Returns:
            dict: The parsed JSON response from the API.

        Raises:
            requests.exceptions.ConnectionError: If there's a network problem (e.g., DNS failure, refused connection).
            requests.exceptions.Timeout: If the request times out after 15 seconds.
            requests.exceptions.HTTPError: For HTTP error status codes (4xx, 5xx),
                                           including parsed error details if available in JSON.
            json.decoder.JSONDecodeError: If the API response content is not valid JSON.
            requests.exceptions.RequestException: For any other requests-related error not covered above.
        """
        full_url = f"{self.base_url}/{path}"
        response = None  # Initialize response to None for error handling outside the try block

        try:
            response = requests.request(method, full_url, params=params, json=json_data, timeout=15)
            response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
            return response.json()
        except JSONDecodeError as e:
            # This happens if response.json() fails, meaning the body isn't valid JSON
            status_code = response.status_code if response is not None else 'N/A'
            response_text = response.text[:200] if response is not None else 'N/A'
            raise JSONDecodeError(
                f"Failed to decode JSON from API response for URL: {full_url} "
                f"(Status: {status_code}). Response content (first 200 chars): {response_text}",
                doc=e.doc, pos=e.pos
            ) from e
        except ConnectionError as e:
            raise ConnectionError(f"Network error connecting to {full_url}: {e}") from e
        except Timeout as e:
            raise Timeout(f"Request to {full_url} timed out after 15 seconds: {e}") from e
        except HTTPError as e:
            # e.response is the actual response object that caused the HTTPError
            try:
                # Attempt to parse error details from JSON if available in the error response body
                error_details = e.response.json()
                raise HTTPError(
                    f"API returned HTTP error {e.response.status_code} for {full_url}: {error_details}",
                    response=e.response
                ) from e
            except JSONDecodeError:
                # If the error response body is not JSON, just raise with its text
                raise HTTPError(
                    f"API returned HTTP error {e.response.status_code} for {full_url}. "
                    f"Response content: {e.response.text[:200]}...",
                    response=e.response
                ) from e
        except RequestException as e:
            # Catch any other requests-related exceptions (e.g., TooManyRedirects)
            raise RequestException(f"An unexpected request error occurred for {full_url}: {e}") from e

    def get_daily_stats(self) -> dict:
        """
        Retrieves daily analytics statistics from the API.

        Expected API Endpoint: GET /stats/daily

        Returns:
            dict: A dictionary containing the daily statistics data.
                  Example: {"date": "2023-10-27", "total_users": 1000, "new_signups": 50, "active_users": 750, ...}

        Raises:
            requests.exceptions.RequestException: If the API call fails due to network issues,
                                                  timeout, HTTP errors, or other request problems.
            json.decoder.JSONDecodeError: If the API response is not valid JSON.
        """
        return self._make_request("GET", "stats/daily")

    def get_user_metrics(self, user_id: str) -> dict:
        """
        Retrieves detailed metrics for a specific user from the API.

        Expected API Endpoint: GET /users/{user_id}/metrics

        Args:
            user_id (str): The unique identifier (e.g., UUID, database ID) of the user.

        Returns:
            dict: A dictionary containing the user's metrics data.
                  Example: {"user_id": "abc-123", "sessions_count": 15, "last_login": "2023-10-27T10:30:00Z",
                            "total_spent": 120.50, ...}

        Raises:
            ValueError: If user_id is empty.
            requests.exceptions.RequestException: If the API call fails.
            json.decoder.JSONDecodeError: If the API response is not valid JSON.
        """
        if not user_id:
            raise ValueError("user_id cannot be empty.")
        # Basic validation for user_id format could be added here if needed (e.g., UUID format check)
        return self._make_request("GET", f"users/{user_id}/metrics")

    def get_revenue_report(self, start_date: str, end_date: str) -> dict:
        """
        Retrieves a revenue report for a specified date range from the API.

        Expected API Endpoint: GET /reports/revenue?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD

        Args:
            start_date (str): The start date for the report in 'YYYY-MM-DD' format.
            end_date (str): The end date for the report in 'YYYY-MM-DD' format.

        Returns:
            dict: A dictionary containing the revenue report data.
                  Example: {"period": "2023-10-01 to 2023-10-31", "total_revenue": 12345.67,
                            "transactions_count": 150, "average_transaction": 82.30, ...}

        Raises:
            ValueError: If start_date or end_date is empty or not in 'YYYY-MM-DD' format.
            requests.exceptions.RequestException: If the API call fails.
            json.decoder.JSONDecodeError: If the API response is not valid JSON.
        """
        if not start_date:
            raise ValueError("start_date cannot be empty.")
        if not end_date:
            raise ValueError("end_date cannot be empty.")

        # Basic date format validation using regex
        import re
        date_pattern = r"^\d{4}-\d{2}-\d{2}$"
        if not re.match(date_pattern, start_date):
            raise ValueError(f"Invalid start_date format: '{start_date}'. Expected 'YYYY-MM-DD'.")
        if not re.match(date_pattern, end_date):
            raise ValueError(f"Invalid end_date format: '{end_date}'. Expected 'YYYY-MM-DD'.")

        params = {
            "start_date": start_date,
            "end_date": end_date
        }
        return self._make_request("GET", "reports/revenue", params=params)