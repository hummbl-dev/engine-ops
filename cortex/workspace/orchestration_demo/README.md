# Flask Todo API

A simple RESTful API built with Flask for managing a list of todo items. This API supports basic CRUD (Create, Read, Update, Delete) operations on todos, using an in-memory dictionary for storage, making it stateless upon server restarts.

## Installation

Follow these steps to set up and run the Flask Todo API locally.

### Prerequisites

*   Python 3.7+
*   pip (Python package installer)

### Steps

1.  **Clone the repository (if applicable) or create a project directory:**

    ```bash
    mkdir flask-todo-api
    cd flask-todo-api
    ```

2.  **Create a virtual environment:**

    ```bash
    python -m venv venv
    ```

3.  **Activate the virtual environment:**

    *   **On macOS/Linux:**

        ```bash
        source venv/bin/activate
        ```

    *   **On Windows:**

        ```bash
        venv\Scripts\activate
        ```

4.  **Install dependencies:**

    Create a `requirements.txt` file in your project root with the following content:
    ```
    Flask
    ```
    Then, install them:

    ```bash
    pip install -r requirements.txt
    ```
    Alternatively, if you prefer not to use `requirements.txt`:
    ```bash
    pip install Flask
    ```

5.  **Create the API file:**

    Save your Flask API code (e.g., as `app.py`) in the project directory.

6.  **Run the Flask application:**

    ```bash
    export FLASK_APP=app.py  # On Windows, use `set FLASK_APP=app.py`
    flask run
    ```
    The API will typically run on `http://127.0.0.1:5000/`.

## API Endpoint Documentation

All endpoints return JSON responses. Errors are indicated by appropriate HTTP status codes and a JSON object containing an `error` message.

### Base URL

`http://127.0.0.1:5000`

---

### 1. Welcome Message

*   **Method:** `GET`
*   **Path:** `/`
*   **Description:** Returns a welcome message for the API.

*   **Request:**
    *   No parameters.

*   **Response (Success - 200 OK):**
    ```json
    {
        "message": "Welcome to the Todo API!"
    }
    ```

---

### 2. Get All Todos

*   **Method:** `GET`
*   **Path:** `/todos`
*   **Description:** Retrieves a list of all todo items.

*   **Request:**
    *   No parameters.

*   **Response (Success - 200 OK):**
    ```json
    [
        {
            "id": 1,
            "task": "Learn Flask"
        },
        {
            "id": 2,
            "task": "Build API"
        }
    ]
    ```
    (Returns an empty array `[]` if no todos exist)

---

### 3. Add a New Todo

*   **Method:** `POST`
*   **Path:** `/todos`
*   **Description:** Creates a new todo item.

*   **Request Body (JSON):**
    ```json
    {
        "task": "Buy groceries"
    }
    ```

*   **Response (Success - 201 Created):**
    ```json
    {
        "id": 3,
        "task": "Buy groceries"
    }
    ```

*   **Response (Error - 400 Bad Request):**
    ```json
    {
        "error": "Task is required"
    }
    ```

---

### 4. Get a Specific Todo

*   **Method:** `GET`
*   **Path:** `/todos/<int:todo_id>`
*   **Description:** Retrieves a single todo item by its ID.

*   **Request:**
    *   **Path Parameter:** `todo_id` (integer) - The ID of the todo item.

*   **Response (Success - 200 OK):**
    ```json
    {
        "id": 1,
        "task": "Learn Flask"
    }
    ```

*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Todo not found"
    }
    ```

---

### 5. Update a Todo

*   **Method:** `PUT`
*   **Path:** `/todos/<int:todo_id>`
*   **Description:** Updates an existing todo item by its ID.

*   **Request:**
    *   **Path Parameter:** `todo_id` (integer) - The ID of the todo item to update.
    *   **Request Body (JSON):**
        ```json
        {
            "task": "Finish Flask tutorial"
        }
        ```

*   **Response (Success - 200 OK):**
    ```json
    {
        "id": 1,
        "task": "Finish Flask tutorial"
    }
    ```

*   **Response (Error - 400 Bad Request):**
    ```json
    {
        "error": "Task is required"
    }
    ```

*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Todo not found"
    }
    ```

---

### 6. Delete a Todo

*   **Method:** `DELETE`
*   **Path:** `/todos/<int:todo_id>`
*   **Description:** Deletes a specific todo item by its ID.

*   **Request:**
    *   **Path Parameter:** `todo_id` (integer) - The ID of the todo item to delete.

*   **Response (Success - 200 OK):**
    ```json
    {
        "message": "Todo deleted successfully"
    }
    ```

*   **Response (Error - 404 Not Found):**
    ```json
    {
        "error": "Todo not found"
    }
    ```

## Example `curl` Commands

Ensure the server is running on `http://127.0.0.1:5000` before trying these commands.

### Get Welcome Message
```bash
curl -X GET http://127.0.0.1:5000/
```

### Get All Todos
```bash
curl -X GET http://127.0.0.1:5000/todos
```

### Add a New Todo
```bash
curl -X POST -H "Content-Type: application/json" -d '{"task": "Learn Docker"}' http://127.0.0.1:5000/todos
```
*(Repeat this command with different tasks to add more todos)*

### Get a Specific Todo (e.g., ID 1)
```bash
curl -X GET http://127.0.0.1:5000/todos/1
```

### Update a Todo (e.g., ID 1)
```bash
curl -X PUT -H "Content-Type: application/json" -d '{"task": "Master Docker for deployment"}' http://127.0.0.1:5000/todos/1
```

### Delete a Todo (e.g., ID 1)
```bash
curl -X DELETE http://127.0.0.1:5000/todos/1
```

## How to Run Tests

No dedicated test suite is currently included with this API. For a production-ready application, it is recommended to implement tests using frameworks like `pytest` or `unittest`.

## Dependencies

The primary dependency for this project is:

*   **Flask**: A micro web framework for Python.