```markdown
# Flask Todo API Deployment Guide

This guide details how to set up, run, test, and deploy the Flask Todo API.

## 1. Local Development Setup

Follow these steps to get the Flask Todo API running on your local machine.

### Prerequisites

*   Python 3.7+
*   `pip` (Python package installer)

### Project Structure

Create a project directory (e.g., `flask-todo-api`) and place your `app.py` and `test_app.py` files inside it.

```
flask-todo-api/
├── app.py
└── test_app.py
└── requirements.txt  (will be created in the next step)
```

### Create a Virtual Environment

It's highly recommended to use a virtual environment to manage project dependencies.

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Install Dependencies

Create a `requirements.txt` file in your project root with the following content:

```
Flask
SQLAlchemy
pytest
python-dotenv
```

Then install them:

```bash
pip install -r requirements.txt
```

### Environment Variables

For local development, you can use `python-dotenv` to load environment variables from a `.env` file. Create a file named `.env` in your project root:

```ini
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your_development_secret_key
DB_URI=sqlite:///site.db
```

*   `FLASK_APP`: Specifies the entry point for the Flask application.
*   `FLASK_ENV`: Sets the Flask environment. `development` enables debug mode, reloader, etc.
*   `SECRET_KEY`: Used by Flask for session management and security features. Choose a strong, unique key for production.
*   `DB_URI`: The SQLAlchemy database connection string. `sqlite:///site.db` creates a local SQLite file.

## 2. Running the Application

Ensure your virtual environment is active. The `flask run` command will automatically pick up the environment variables from `.env` if `python-dotenv` is installed.

```bash
flask run
```

The application will typically start on `http://127.0.0.1:5000/`. You should see output similar to:

```
 * Serving Flask app 'app.py'
 * Environment: development
 * Debug mode: on
 * Running on http://127.0.0.1:5000 (Press CTRL+C to quit)
 * Restarting with stat
 * Debugger is active!
 * Debugger PIN: XXX-XXX-XXX
```

You can now interact with the API endpoints (e.g., `GET /todos`, `POST /todos`) using tools like `curl`, Postman, or your browser.

## 3. Running Tests

To run the tests for the API:

```bash
pytest
```

You should see output indicating that all tests have passed:

```
============================= test session starts ==============================
...
collected 5 items

test_app.py .....                                                        [100%]

============================== 5 passed in X.XXs ===============================
```

## 4. Environment Variables Needed

The following environment variables are essential for the application to function correctly:

*   **`FLASK_APP`**: (Required) Specifies the Python file that contains your Flask application instance (e.g., `app.py`).
*   **`FLASK_ENV`**: (Required) Sets the environment for Flask.
    *   `development`: Enables debug mode, reloader, and detailed error messages.
    *   `production`: Disables debug mode and provides less verbose error messages, suitable for production.
*   **`SECRET_KEY`**: (Required) A strong, randomly generated secret key used by Flask for cryptographic operations like signing cookies and protecting against CSRF attacks. **In production, this must be a unique, complex, and securely stored value.**
*   **`DB_URI`**: (Required) The SQLAlchemy database connection string. Examples:
    *   `sqlite:///site.db` (for local SQLite file, not recommended for production)
    *   `postgresql://user:password@host:port/database_name` (for PostgreSQL)
    *   `mysql+pymysql://user:password@host:port/database_name` (for MySQL with PyMySQL driver)

## 5. Production Deployment Considerations

For a production environment, you need to set up a robust and scalable infrastructure.

### WSGI Server

Flask's built-in development server is not suitable for production. You should use a production-ready WSGI (Web Server Gateway Interface) server like Gunicorn or uWSGI.

**Example with Gunicorn:**

1.  Install Gunicorn:
    ```bash
    pip install gunicorn
    ```
2.  Run Gunicorn (replace `app:app` with `your_app_file_name:your_flask_app_instance_name`):
    ```bash
    gunicorn -w 4 -b 0.0.0.0:5000 app:app
    ```
    *   `-w 4`: Specifies 4 worker processes. Adjust based on your server's CPU cores.
    *   `-b 0.0.0.0:5000`: Binds Gunicorn to all network interfaces on port 5000.
    *   `app:app`: Tells Gunicorn to load the `app` instance from the `app.py` file.

### Reverse Proxy

Place a reverse proxy (e.g., Nginx, Apache) in front of your WSGI server. A reverse proxy provides:

*   **SSL/TLS Termination (HTTPS)**: Essential for securing communication.
*   **Load Balancing**: Distribute requests across multiple WSGI server instances.
*   **Static File Serving**: (If your application had static assets, which this API doesn't)
*   **Caching**: Improve performance for frequently accessed content.
*   **Security**: Protect against certain types of attacks.

### Database Management

*   **External Database**: The current setup uses a local SQLite file (`sqlite:///site.db`), which is **not suitable for production**. Use a robust, external database like PostgreSQL, MySQL, or a managed database service. Update the `DB_URI` environment variable accordingly.
*   **Database Migrations**: The `db.create_all()` call inside `@app.before_request` is a **critical issue for production**. It should be removed.
    *   `db.create_all()` should only be called once, typically during initial deployment or development.
    *   In production, use a dedicated migration tool like [Flask-Migrate](https://flask-migrate.readthedocs.io/en/latest/) (which uses Alembic) to manage schema changes safely. This allows you to evolve your database schema without losing data.
    *   The `db.drop_all()` and `db.create_all()` in the test fixture are fine for testing but must not be used in production.

### Environment Variables in Production

*   **`SECRET_KEY`**: Generate a very strong, random, and unique secret key. Never hardcode it; use environment variables or a secret management service.
*   **`FLASK_ENV=production`**: Always set this in production.
*   **`DB_URI`**: Set this to the connection string of your production database.

### Logging

Configure proper logging for your application. In production, logs should be directed to a persistent storage solution (e.g., log files, a centralized logging service like ELK stack, Splunk, or cloud-native logging services).

### Security

*   **HTTPS**: Always serve your API over HTTPS.
*   **Input Validation**: Ensure all incoming data is properly validated to prevent common web vulnerabilities.
*   **Error Handling**: Provide generic error messages to clients instead of detailed stack traces that could expose sensitive information.

## 6. Docker Deployment

Docker provides a consistent environment for deploying your application.

### Dockerfile

Create a `Dockerfile` in your project root:

```dockerfile
# Use an official Python runtime as a parent image
FROM python:3.9-slim-buster

# Set the working directory in the container
WORKDIR /app

# Install system dependencies if any (none for this app, but good practice)
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     build-essential \
#     && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application using Gunicorn
# The `app:app` refers to the Flask app instance named 'app' in 'app.py'
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

### `requirements.txt` for Docker

Ensure your `requirements.txt` includes `gunicorn`:

```
Flask
SQLAlchemy
pytest
python-dotenv
gunicorn
```

### Build and Run Docker Image

1.  **Build the Docker image**:
    ```bash
    docker build -t flask-todo-api .
    ```

2.  **Run the Docker container**:
    You need to pass the environment variables for `SECRET_KEY` and `DB_URI`.
    ```bash
    docker run -p 5000:5000 \
               -e SECRET_KEY="your_strong_secret_key_here" \
               -e DB_URI="your_production_db_uri_here" \
               -e FLASK_ENV="production" \
               flask-todo-api
    ```
    *   `-p 5000:5000`: Maps port 5000 of the container to port 5000 on your host.
    *   `-e`: Used to pass environment variables to the container.

### Docker Compose (Optional, for multi-service deployments)

If you were deploying with a separate database service (e.g., PostgreSQL), you would use Docker Compose.

**`docker-compose.yml` example:**

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      FLASK_ENV: production
      SECRET_KEY: your_strong_secret_key_here
      # Assuming db service name is 'db'
      DB_URI: postgresql://user:password@db:5432/todo_db
    depends_on:
      - db

  db:
    image: postgres:13
    restart: always
    environment:
      POSTGRES_DB: todo_db
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

**Run with Docker Compose:**

```bash
docker-compose up --build
```

This guide provides a comprehensive path from local development to production-ready deployment for your Flask Todo API. Remember to prioritize security and database management best practices in production.
```