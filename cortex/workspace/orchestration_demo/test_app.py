import pytest
from flask import Flask, jsonify, request, abort
from flask_cors import CORS

# --- Flask Application Code (Mimicking the user's API) ---
# This section defines the Flask application and its routes.
# In a real project, this would typically be in a separate file (e.g., `app.py`).

# In-memory "database" for testing purposes.
# This will be reset before each test to ensure test isolation.
books_db = {}
book_id_counter = 0

def create_app():
    """Factory function to create and configure the Flask app."""
    app = Flask(__name__)
    CORS(app) # Enable CORS for all routes

    # Custom error handler for 404 Not Found errors
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not Found', 'message': error.description}), 404

    # Custom error handler for 400 Bad Request errors
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad Request', 'message': error.description}), 400

    @app.route('/books', methods=['GET'])
    def get_books():
        """Returns a list of all books."""
        return jsonify(list(books_db.values()))

    @app.route('/books/<int:book_id>', methods=['GET'])
    def get_book(book_id):
        """Returns a single book by its ID."""
        book = books_db.get(book_id)
        if book is None:
            abort(404, description="Book not found")
        return jsonify(book)

    @app.route('/books', methods=['POST'])
    def create_book():
        """Creates a new book."""
        global book_id_counter
        if not request.json:
            abort(400, description="Request body must be JSON")

        data = request.json
        title = data.get('title')
        author = data.get('author')

        # Input validation for required fields and types
        if not title or not author:
            abort(400, description="Missing 'title' or 'author' fields")
        if not isinstance(title, str) or not isinstance(author, str):
            abort(400, description="Title and author must be strings")
        if not title.strip() or not author.strip():
            abort(400, description="Title and author cannot be empty")

        book_id_counter += 1
        book = {
            'id': book_id_counter,
            'title': title,
            'author': author
        }
        books_db[book_id_counter] = book
        return jsonify(book), 201

    @app.route('/books/<int:book_id>', methods=['PUT'])
    def update_book(book_id):
        """Updates an existing book by its ID."""
        book = books_db.get(book_id)
        if book is None:
            abort(404, description="Book not found")

        if not request.json:
            abort(400, description="Request body must be JSON")

        data = request.json
        title = data.get('title')
        author = data.get('author')

        updated_fields = False
        if title is not None:
            if not isinstance(title, str):
                abort(400, description="Title must be a string")
            if not title.strip():
                abort(400, description="Title cannot be empty")
            book['title'] = title
            updated_fields = True
        if author is not None:
            if not isinstance(author, str):
                abort(400, description="Author must be a string")
            if not author.strip():
                abort(400, description="Author cannot be empty")
            book['author'] = author
            updated_fields = True

        if not updated_fields:
            abort(400, description="No valid fields provided for update")

        return jsonify(book)

    @app.route('/books/<int:book_id>', methods=['DELETE'])
    def delete_book(book_id):
        """Deletes a book by its ID."""
        if book_id not in books_db:
            abort(404, description="Book not found")
        del books_db[book_id]
        return '', 204 # No Content

    return app

# --- Pytest Fixtures ---

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    global books_db, book_id_counter
    # Clear the "database" and reset counter before each test
    books_db = {}
    book_id_counter = 0

    app = create_app()
    app.config.update({
        "TESTING": True,
    })
    yield app # Provide the app to the test

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

# --- Pytest Test Cases ---

def test_get_books_empty_list(client):
    """Test GET /books when no books are present, expecting an empty list."""
    response = client.get('/books')
    assert response.status_code == 200
    assert response.json == []
    assert 'Access-Control-Allow-Origin' in response.headers
    assert response.headers['Access-Control-Allow-Origin'] == '*'

def test_create_book(client):
    """Test POST /books with valid data, expecting a 201 Created status."""
    book_data = {'title': 'The Great Gatsby', 'author': 'F. Scott Fitzgerald'}
    response = client.post('/books', json=book_data)
    assert response.status_code == 201
    assert response.json['title'] == book_data['title']
    assert response.json['author'] == book_data['author']
    assert response.json['id'] == 1 # First book created should have ID 1
    assert 'Access-Control-Allow-Origin' in response.headers

def test_get_books_with_data(client):
    """Test GET /books after creating a book, expecting the list to contain the new book."""
    book_data = {'title': '1984', 'author': 'George Orwell'}
    client.post('/books', json=book_data) # Create one book

    response = client.get('/books')
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]['title'] == book_data['title']

def test_get_single_book(client):
    """Test GET /books/<id> for an existing book, expecting the correct book data."""
    book_data = {'title': 'To Kill a Mockingbird', 'author': 'Harper Lee'}
    post_response = client.post('/books', json=book_data)
    book_id = post_response.json['id']

    get_response = client.get(f'/books/{book_id}')
    assert get_response.status_code == 200
    assert get_response.json['title'] == book_data['title']
    assert get_response.json['id'] == book_id

def test_update_book(client):
    """Test PUT /books/<id> with valid data, expecting the book to be updated."""
    book_data = {'title': 'Original Title', 'author': 'Original Author'}
    post_response = client.post('/books', json=book_data)
    book_id = post_response.json['id']

    update_data = {'title': 'Updated Title', 'author': 'Updated Author'}
    put_response = client.put(f'/books/{book_id}', json=update_data)
    assert put_response.status_code == 200
    assert put_response.json['title'] == update_data['title']
    assert put_response.json['author'] == update_data['author']

    # Verify through a GET request
    get_response = client.get(f'/books/{book_id}')
    assert get_response.json['title'] == update_data['title']

def test_delete_book(client):
    """Test DELETE /books/<id> for an existing book, expecting a 204 No Content status."""
    book_data = {'title': 'Delete Me', 'author': 'Author X'}
    post_response = client.post('/books', json=book_data)
    book_id = post_response.json['id']

    delete_response = client.delete(f'/books/{book_id}')
    assert delete_response.status_code == 204

    # Verify deletion by trying to get the book, which should result in 404
    get_response = client.get(f'/books/{book_id}')
    assert get_response.status_code == 404

def test_create_book_missing_fields(client):
    """Test POST /books with missing required fields, expecting a 400 Bad Request."""
    response = client.post('/books', json={'title': 'Missing Author'})
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'Missing' in response.json['message']

    response = client.post('/books', json={'author': 'Missing Title'})
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'Missing' in response.json['message']

def test_create_book_invalid_type(client):
    """Test POST /books with non-string title/author, expecting a 400 Bad Request."""
    response = client.post('/books', json={'title': 123, 'author': 'Author'})
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'must be strings' in response.json['message']

def test_create_book_empty_string_fields(client):
    """Test POST /books with empty string or whitespace-only title/author, expecting a 400 Bad Request."""
    response = client.post('/books', json={'title': '', 'author': 'Author'})
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'cannot be empty' in response.json['message']

    response = client.post('/books', json={'title': 'Title', 'author': '   '})
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'cannot be empty' in response.json['message']

def test_get_nonexistent_book(client):
    """Test GET /books/<id> for a non-existent book, expecting a 404 Not Found."""
    response = client.get('/books/999')
    assert response.status_code == 404
    assert 'error' in response.json
    assert 'Book not found' in response.json['message']

def test_update_nonexistent_book(client):
    """Test PUT /books/<id> for a non-existent book, expecting a 404 Not Found."""
    response = client.put('/books/999', json={'title': 'New Title'})
    assert response.status_code == 404
    assert 'error' in response.json
    assert 'Book not found' in response.json['message']

def test_delete_nonexistent_book(client):
    """Test DELETE /books/<id> for a non-existent book, expecting a 404 Not Found."""
    response = client.delete('/books/999')
    assert response.status_code == 404
    assert 'error' in response.json
    assert 'Book not found' in response.json['message']

def test_update_book_invalid_type(client):
    """Test PUT /books/<id> with non-string title/author, expecting a 400 Bad Request."""
    book_data = {'title': 'Test Book', 'author': 'Test Author'}
    post_response = client.post('/books', json=book_data)
    book_id = post_response.json['id']

    response = client.put(f'/books/{book_id}', json={'title': 123})
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'Title must be a string' in response.json['message']

def test_update_book_empty_string_fields(client):
    """Test PUT /books/<id> with empty string or whitespace-only title/author, expecting a 400 Bad Request."""
    book_data = {'title': 'Test Book', 'author': 'Test Author'}
    post_response = client.post('/books', json=book_data)
    book_id = post_response.json['id']

    response = client.put(f'/books/{book_id}', json={'title': ''})
    assert response.status_code == 400
    assert 'error' in response.json
    assert 'Title cannot be empty' in response.json['message']

def test_update_book_no_fields_provided(client):
    """Test PUT /books/<id> with empty JSON body or no valid fields, expecting a 400 Bad Request."""
    book_data = {'title': 'Test Book', 'author': 'Test Author'}
    post_response = client.post('/books', json=book_data)
    book_id = post_response.json['id']

    response = client.put(f'/books/{book_id}', json={})
    assert response.status_code == 400
    assert 'No valid fields provided for update' in response.json['message']

def test_cors_headers_options(client):
    """Test CORS preflight OPTIONS request for /books, checking allowed origin and methods."""
    response = client.options(
        '/books',
        headers={
            'Origin': 'http://example.com',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
    )
    assert response.status_code == 200
    assert 'Access-Control-Allow-Origin' in response.headers
    assert response.headers['Access-Control-Allow-Origin'] == '*'
    assert 'Access-Control-Allow-Methods' in response.headers
    assert 'POST' in response.headers['Access-Control-Allow-Methods']
    assert 'Access-Control-Allow-Headers' in response.headers
    assert 'content-type' in response.headers['Access-Control-Allow-Headers'].lower() # Headers can be case-insensitive

def test_cors_headers_post(client):
    """Test CORS headers for an actual POST request to /books."""
    book_data = {'title': 'CORS Test', 'author': 'CORS Author'}
    response = client.post('/books', json=book_data, headers={'Origin': 'http://example.com'})
    assert response.status_code == 201
    assert 'Access-Control-Allow-Origin' in response.headers
    assert response.headers['Access-Control-Allow-Origin'] == '*'

def test_general_404_not_found(client):
    """Test accessing a non-existent URL path, expecting a 404 Not Found."""
    response = client.get('/nonexistent-path')
    assert response.status_code == 404
    assert 'error' in response.json
    assert 'Not Found' in response.json['error']