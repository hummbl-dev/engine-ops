import requests
import os
import mimetypes

class FileAPIClient:
    """
    A Python client for interacting with a REST API that handles file operations.

    This client provides methods for uploading, downloading, deleting, and listing files
    on a remote server, using the 'requests' library for HTTP communication.
    """

    def __init__(self, base_url, api_key=None, default_headers=None):
        """
        Initializes the FileAPIClient with the base URL of the API.

        Args:
            base_url (str): The base URL for the file API (e.g., "http://localhost:8000/api/files").
            api_key (str, optional): An API key for authentication, if required by the server.
                                     It will be sent as a Bearer token in the Authorization header.
            default_headers (dict, optional): A dictionary of default headers to include in all requests.
                                              These will override internal headers if keys conflict.
        """
        if not base_url.endswith('/'):
            base_url += '/'
        self.base_url = base_url
        self.api_key = api_key
        self.default_headers = default_headers if default_headers is not None else {}

    def _get_headers(self, additional_headers=None):
        """
        Constructs the headers for an HTTP request.

        Args:
            additional_headers (dict, optional): Extra headers to merge with default headers
                                                 for a specific request.

        Returns:
            dict: A dictionary of HTTP headers.
        """
        headers = self.default_headers.copy()
        if self.api_key:
            headers['Authorization'] = f'Bearer {self.api_key}'
        if additional_headers:
            headers.update(additional_headers)
        return headers

    def upload_file(self, file_path, endpoint="upload", form_field_name="file"):
        """
        Uploads a file to the API using multipart/form-data.

        Args:
            file_path (str): The local path to the file to be uploaded.
            endpoint (str, optional): The API endpoint for file uploads relative to base_url
                                      (default: "upload").
            form_field_name (str, optional): The name of the form field that the API expects
                                             for the file data (default: "file").

        Returns:
            dict or None: The JSON response from the API if successful, otherwise None.

        Raises:
            FileNotFoundError: If the specified file_path does not exist.
            requests.exceptions.RequestException: For any network-related errors or
                                                  unsuccessful HTTP status codes.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found at: {file_path}")

        file_name = os.path.basename(file_path)
        mime_type, _ = mimetypes.guess_type(file_path)
        if mime_type is None:
            mime_type = 'application/octet-stream' # Default if type cannot be guessed

        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()
        # requests handles Content-Type for multipart/form-data automatically,
        # so we don't set it explicitly in headers for 'files' argument.

        try:
            with open(file_path, 'rb') as f:
                # The 'files' parameter handles multipart/form-data encoding.
                # Format: {'form_field_name': (filename, file_object, content_type)}
                files = {form_field_name: (file_name, f, mime_type)}
                response = requests.post(url, files=files, headers=headers)
                response.raise_for_status()  # Raise an exception for HTTP errors (4xx or 5xx)
                return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error uploading file {file_name}: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"API Response Status: {e.response.status_code}")
                print(f"API Response Content: {e.response.text}")
            raise # Re-raise the exception after logging
        except Exception as e:
            print(f"An unexpected error occurred during file upload: {e}")
            raise

    def download_file(self, file_id, download_path, endpoint="download"):
        """
        Downloads a file from the API to a specified local path.

        Args:
            file_id (str): The ID of the file to download as recognized by the API.
            download_path (str): The local path where the downloaded file will be saved.
                                 The directory will be created if it doesn't exist.
            endpoint (str, optional): The API endpoint for file downloads relative to base_url
                                      (default: "download").
                                      Assumes a URL structure like {base_url}/download/{file_id}.

        Returns:
            bool: True if the file was downloaded successfully, False otherwise.

        Raises:
            requests.exceptions.RequestException: For any network-related errors or
                                                  unsuccessful HTTP status codes.
        """
        url = f"{self.base_url}{endpoint}/{file_id}"
        headers = self._get_headers()

        try:
            # Use stream=True to handle potentially large files efficiently without
            # loading the entire content into memory at once.
            with requests.get(url, headers=headers, stream=True) as response:
                response.raise_for_status()  # Raise an exception for HTTP errors

                # Ensure the directory for the download_path exists
                os.makedirs(os.path.dirname(download_path), exist_ok=True)

                with open(download_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk: # Filter out keep-alive new chunks
                            f.write(chunk)
                return True
        except requests.exceptions.RequestException as e:
            print(f"Error downloading file {file_id}: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"API Response Status: {e.response.status_code}")
                print(f"API Response Content: {e.response.text}")
            raise # Re-raise the exception after logging
        except Exception as e:
            print(f"An unexpected error occurred during file download: {e}")
            raise

    def delete_file(self, file_id, endpoint="delete"):
        """
        Deletes a file from the API.

        Args:
            file_id (str): The ID of the file to delete as recognized by the API.
            endpoint (str, optional): The API endpoint for file deletion relative to base_url
                                      (default: "delete").
                                      Assumes a URL structure like {base_url}/delete/{file_id}.

        Returns:
            bool: True if the file was deleted successfully (e.g., 200, 204 status), False otherwise.

        Raises:
            requests.exceptions.RequestException: For any network-related errors or
                                                  unsuccessful HTTP status codes.
        """
        url = f"{self.base_url}{endpoint}/{file_id}"
        headers = self._get_headers()

        try:
            response = requests.delete(url, headers=headers)
            response.raise_for_status()  # Raise an exception for HTTP errors (4xx or 5xx)
            return True
        except requests.exceptions.RequestException as e:
            print(f"Error deleting file {file_id}: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"API Response Status: {e.response.status_code}")
                print(f"API Response Content: {e.response.text}")
            raise # Re-raise the exception after logging
        except Exception as e:
            print(f"An unexpected error occurred during file deletion: {e}")
            raise

    def list_files(self, endpoint="list", params=None):
        """
        Lists available files from the API.

        Args:
            endpoint (str, optional): The API endpoint for listing files relative to base_url
                                      (default: "list").
            params (dict, optional): A dictionary of query parameters to include in the request.
                                     (e.g., {'limit': 10, 'offset': 0}).

        Returns:
            list or None: A list of file metadata (e.g., list of dicts) if successful, otherwise None.

        Raises:
            requests.exceptions.RequestException: For any network-related errors or
                                                  unsuccessful HTTP status codes.
        """
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()

        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()  # Raise an exception for HTTP errors (4xx or 5xx)
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error listing files: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"API Response Status: {e.response.status_code}")
                print(f"API Response Content: {e.response.text}")
            raise # Re-raise the exception after logging
        except Exception as e:
            print(f"An unexpected error occurred during file listing: {e}")
            raise