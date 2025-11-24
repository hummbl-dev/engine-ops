class ProductAPIClient:
    """
    A client for interacting with a Product/Inventory REST API.

    Handles operations like fetching product details, listing products,
    searching products, and updating product stock.
    """

    def __init__(self, base_url: str, api_key: str = None):
        """
        Initializes the ProductAPIClient.

        Args:
            base_url (str): The base URL of the product API (e.g., "https://api.example.com/v1").
            api_key (str, optional): An API key for authentication, if required by the API.
                                     This will be sent in an 'Authorization' header as a Bearer token.
        """
        self.base_url = base_url.rstrip('/')
        self.headers = {'Content-Type': 'application/json'}
        if api_key:
            self.headers['Authorization'] = f'Bearer {api_key}'

    def _request(self, method: str, endpoint: str, **kwargs):
        """
        Internal helper method to make HTTP requests.

        Args:
            method (str): The HTTP method (e.g., 'GET', 'POST', 'PUT', 'DELETE').
            endpoint (str): The API endpoint relative to the base URL (e.g., '/products').
            **kwargs: Additional arguments to pass to requests.request (e.g., json, params).

        Returns:
            dict or None: The JSON response from the API, or None if the request failed.

        Raises:
            requests.exceptions.RequestException: If an HTTP request fails.
        """
        import requests
        url = f"{self.base_url}{endpoint}"
        try:
            response = requests.request(method, url, headers=self.headers, **kwargs)
            response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
            return response.json()
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
            print(f"An unexpected Request Error occurred for {method} {url}: {e}")
            raise
        except ValueError: # If response.json() fails
            print(f"Could not decode JSON from response: {response.text}")
            return None

    def get_product(self, product_id: str) -> dict or None:
        """
        Retrieves details for a specific product by its ID.

        Args:
            product_id (str): The unique identifier of the product.

        Returns:
            dict or None: A dictionary containing product details if found, otherwise None.
        """
        endpoint = f"/products/{product_id}"
        try:
            return self._request("GET", endpoint)
        except Exception:
            return None # Or re-raise, depending on desired error handling

    def list_products(self, page: int = 1, page_size: int = 10) -> list or None:
        """
        Lists all products with optional pagination.

        Args:
            page (int, optional): The page number to retrieve. Defaults to 1.
            page_size (int, optional): The number of items per page. Defaults to 10.

        Returns:
            list or None: A list of product dictionaries, or None if the request failed.
        """
        endpoint = "/products"
        params = {"page": page, "page_size": page_size}
        try:
            return self._request("GET", endpoint, params=params)
        except Exception:
            return None

    def search_products(self, query: str) -> list or None:
        """
        Searches for products matching a given query string.

        Args:
            query (str): The search string (e.g., product name, SKU, description).

        Returns:
            list or None: A list of product dictionaries matching the query, or None if the request failed.
        """
        endpoint = "/products/search" # Assuming an API endpoint like /products/search?q=query
        params = {"q": query}
        try:
            return self._request("GET", endpoint, params=params)
        except Exception:
            return None

    def update_stock(self, product_id: str, quantity: int) -> dict or None:
        """
        Updates the stock quantity for a specific product.

        Args:
            product_id (str): The unique identifier of the product.
            quantity (int): The new stock quantity. This typically overwrites the existing stock.
                            For incremental updates, the API might support a 'delta' or 'add' operation.

        Returns:
            dict or None: A dictionary containing the updated product details, or None if the update failed.
        """
        endpoint = f"/products/{product_id}/stock"
        data = {"quantity": quantity}
        try:
            # Assuming PUT for full replacement of stock, PATCH for partial update (e.g., increment)
            # We'll use PUT here for simplicity, replacing the stock.
            return self._request("PUT", endpoint, json=data)
        except Exception:
            return None