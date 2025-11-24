from flask import Flask, jsonify, request, abort
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# In-memory storage for tasks
tasks = []
task_id_counter = 1

# Error handling
@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad Request', 'message': str(error)}), 400

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not Found', 'message': str(error)}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Method Not Allowed', 'message': str(error)}), 405

@app.errorhandler(500)
def internal_server_error(error):
    return jsonify({'error': 'Internal Server Error', 'message': str(error)}), 500

# Helper function to find a task by ID
def find_task(task_id):
    for task in tasks:
        if task['id'] == task_id:
            return task
    return None

# Helper function to validate task data
def validate_task_data(data, is_new=True):
    if not isinstance(data, dict):
        abort(400, description="Request body must be a JSON object.")

    if is_new and 'title' not in data:
        abort(400, description="'title' field is required.")
    elif 'title' in data and not isinstance(data['title'], str):
        abort(400, description="'title' must be a string.")
    
    if 'description' in data and not isinstance(data['description'], str):
        abort(400, description="'description' must be a string.")

    if 'done' in data and not isinstance(data['done'], bool):
        abort(400, description="'done' must be a boolean.")
    
    return data

# Endpoints

# GET all tasks
@app.route('/tasks', methods=['GET'])
def get_tasks():
    return jsonify(tasks), 200

# POST a new task
@app.route('/tasks', methods=['POST'])
def create_task():
    global task_id_counter
    if not request.json:
        abort(400, description="Request must contain JSON data.")
    
    data = validate_task_data(request.json, is_new=True)

    new_task = {
        'id': task_id_counter,
        'title': data['title'],
        'description': data.get('description', ''),
        'done': data.get('done', False)
    }
    tasks.append(new_task)
    task_id_counter += 1
    return jsonify(new_task), 201

# GET a single task by ID
@app.route('/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    task = find_task(task_id)
    if not task:
        abort(404, description=f"Task with ID {task_id} not found.")
    return jsonify(task), 200

# PUT (update) an existing task by ID
@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = find_task(task_id)
    if not task:
        abort(404, description=f"Task with ID {task_id} not found.")

    if not request.json:
        abort(400, description="Request must contain JSON data.")
    
    data = validate_task_data(request.json, is_new=False)

    if 'title' in data:
        task['title'] = data['title']
    if 'description' in data:
        task['description'] = data['description']
    if 'done' in data:
        task['done'] = data['done']
    
    return jsonify(task), 200

# DELETE a task by ID
@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    global tasks
    task_to_delete = find_task(task_id)
    if not task_to_delete:
        abort(404, description=f"Task with ID {task_id} not found.")
    
    tasks = [task for task in tasks if task['id'] != task_id]
    return '', 204 # No Content

if __name__ == '__main__':
    app.run(debug=True)