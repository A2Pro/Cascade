from flask import Flask, jsonify, request, session
from flask_cors import CORS
from openai import OpenAI
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import secrets
import uuid
import math
import re


load_dotenv()

MONGO_URI_STRING = os.getenv('MONGO_URI_STRING')
mongoClient = MongoClient(MONGO_URI_STRING, server_api=ServerApi('1'))

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
openai = OpenAI(api_key=OPENAI_API_KEY)

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(16))

db = mongoClient["Database"]
users_collection = db["users"]
requests_collection = db["requests"]

# Helper functions
def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula (in km)"""
    R = 6371  # Earth's radius in km
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat/2) * math.sin(dlat/2) + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
         math.sin(dlon/2) * math.sin(dlon/2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    
    return distance

def require_auth(f):
    """Decorator to require authentication"""
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

def get_current_user():
    """Get current user from session"""
    if 'user_id' not in session:
        return None
    return users_collection.find_one({'_id': ObjectId(session['user_id'])})

# Authentication endpoints
@app.route('/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'name', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        name = data['name'].strip()
        role = data['role']
        
        # Validate email format
        if not is_valid_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate role
        if role not in ['victim', 'volunteer']:
            return jsonify({'error': 'Role must be either "victim" or "volunteer"'}), 400
        
        # Validate password strength
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Check if user already exists
        if users_collection.find_one({'email': email}):
            return jsonify({'error': 'User with this email already exists'}), 409
        
        # Create user
        user_data = {
            'email': email,
            'password_hash': generate_password_hash(password),
            'name': name,
            'role': role,
            'phone': data.get('phone', ''),
            'location': data.get('location', {}),
            'skills': data.get('skills', []) if role == 'volunteer' else [],
            'profile_complete': False,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = users_collection.insert_one(user_data)
        user_id = str(result.inserted_id)
        
        # Create session
        session['user_id'] = user_id
        session['role'] = role
        
        return jsonify({
            'message': 'User created successfully',
            'user_id': user_id,
            'role': role
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = users_collection.find_one({'email': email})
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Create session
        session['user_id'] = str(user['_id'])
        session['role'] = user['role']
        
        return jsonify({
            'message': 'Login successful',
            'user_id': str(user['_id']),
            'role': user['role'],
            'name': user['name']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/auth/me', methods=['GET'])
@require_auth
def get_current_user_info():
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user['_id'] = str(user['_id'])
        user.pop('password_hash', None)
        
        return jsonify(user), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Profile management
@app.route('/profile', methods=['PUT'])
@require_auth
def update_profile():
    try:
        data = request.get_json()
        user = get_current_user()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        update_data = {
            'updated_at': datetime.utcnow()
        }
        
        # Update allowed fields
        allowed_fields = ['name', 'phone', 'location', 'skills']
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        # Mark profile as complete if location is provided
        if 'location' in data and data['location'].get('latitude') and data['location'].get('longitude'):
            update_data['profile_complete'] = True
        
        users_collection.update_one(
            {'_id': ObjectId(session['user_id'])},
            {'$set': update_data}
        )
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Request management
@app.route('/requests', methods=['POST'])
@require_auth
def create_request():
    try:
        data = request.get_json()
        user = get_current_user()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user['role'] != 'victim':
            return jsonify({'error': 'Only victims can create help requests'}), 403
        
        # Validate required fields
        required_fields = ['type', 'description', 'urgency']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate help type
        valid_types = ['food', 'water', 'shelter', 'transport', 'medical', 'other']
        if data['type'] not in valid_types:
            return jsonify({'error': f'Type must be one of: {", ".join(valid_types)}'}), 400
        
        # Validate urgency
        if data['urgency'] not in ['low', 'medium', 'high']:
            return jsonify({'error': 'Urgency must be low, medium, or high'}), 400
        
        # Use user's location if not provided
        location = data.get('location', user.get('location', {}))
        if not location.get('latitude') or not location.get('longitude'):
            return jsonify({'error': 'Location is required'}), 400
        
        request_data = {
            'victim_id': ObjectId(session['user_id']),
            'victim_name': user['name'],
            'victim_phone': user.get('phone', ''),
            'type': data['type'],
            'description': data['description'],
            'urgency': data['urgency'],
            'location': location,
            'status': 'pending',
            'volunteer_id': None,
            'volunteer_name': None,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'fulfilled_at': None
        }
        
        result = requests_collection.insert_one(request_data)
        
        return jsonify({
            'message': 'Help request created successfully',
            'request_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/requests', methods=['GET'])
@require_auth
def get_requests():
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get query parameters
        status = request.args.get('status')
        help_type = request.args.get('type')
        urgency = request.args.get('urgency')
        max_distance = request.args.get('max_distance', type=float)
        
        # Build filter
        filter_query = {}
        
        if user['role'] == 'victim':
            # Victims see only their own requests
            filter_query['victim_id'] = ObjectId(session['user_id'])
        else:
            # Volunteers see all pending requests by default
            if status:
                filter_query['status'] = status
            else:
                filter_query['status'] = 'pending'
        
        if help_type:
            filter_query['type'] = help_type
        
        if urgency:
            filter_query['urgency'] = urgency
        
        # Get requests
        requests = list(requests_collection.find(filter_query).sort('created_at', -1))
        
        # Calculate distances and filter by distance for volunteers
        user_location = user.get('location', {})
        if user['role'] == 'volunteer' and user_location.get('latitude') and user_location.get('longitude'):
            for req in requests:
                req_location = req.get('location', {})
                if req_location.get('latitude') and req_location.get('longitude'):
                    distance = calculate_distance(
                        user_location['latitude'], user_location['longitude'],
                        req_location['latitude'], req_location['longitude']
                    )
                    req['distance'] = round(distance, 2)
                else:
                    req['distance'] = None
            
            # Filter by max distance if specified
            if max_distance:
                requests = [req for req in requests if req.get('distance') and req['distance'] <= max_distance]
            
            # Sort by distance
            requests.sort(key=lambda x: x.get('distance', float('inf')))
        
        # Convert ObjectIds to strings
        for req in requests:
            req['_id'] = str(req['_id'])
            req['victim_id'] = str(req['victim_id'])
            if req.get('volunteer_id'):
                req['volunteer_id'] = str(req['volunteer_id'])
        
        return jsonify(requests), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/requests/<request_id>/volunteer', methods=['PUT'])
@require_auth
def volunteer_for_request(request_id):
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user['role'] != 'volunteer':
            return jsonify({'error': 'Only volunteers can offer help'}), 403
        
        # Find the request
        help_request = requests_collection.find_one({'_id': ObjectId(request_id)})
        if not help_request:
            return jsonify({'error': 'Request not found'}), 404
        
        if help_request['status'] != 'pending':
            return jsonify({'error': 'Request is no longer available'}), 400
        
        # Calculate distance
        distance = None
        user_location = user.get('location', {})
        req_location = help_request.get('location', {})
        
        if (user_location.get('latitude') and user_location.get('longitude') and
            req_location.get('latitude') and req_location.get('longitude')):
            distance = calculate_distance(
                user_location['latitude'], user_location['longitude'],
                req_location['latitude'], req_location['longitude']
            )
        
        # Update request
        requests_collection.update_one(
            {'_id': ObjectId(request_id)},
            {
                '$set': {
                    'status': 'in_progress',
                    'volunteer_id': ObjectId(session['user_id']),
                    'volunteer_name': user['name'],
                    'volunteer_phone': user.get('phone', ''),
                    'volunteer_distance': round(distance, 2) if distance else None,
                    'volunteer_location': user.get('location', {}),
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        return jsonify({'message': 'Successfully volunteered for request'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/requests/<request_id>/status', methods=['PUT'])
@require_auth
def update_request_status(request_id):
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['pending', 'in_progress', 'fulfilled', 'cancelled']:
            return jsonify({'error': 'Invalid status'}), 400
        
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Find the request
        help_request = requests_collection.find_one({'_id': ObjectId(request_id)})
        if not help_request:
            return jsonify({'error': 'Request not found'}), 404
        
        # Check permissions
        is_victim = str(help_request['victim_id']) == session['user_id']
        is_volunteer = help_request.get('volunteer_id') and str(help_request['volunteer_id']) == session['user_id']
        
        if not (is_victim or is_volunteer):
            return jsonify({'error': 'Not authorized to update this request'}), 403
        
        # Validate status transitions
        current_status = help_request['status']
        
        if current_status == 'fulfilled':
            return jsonify({'error': 'Cannot change status of fulfilled request'}), 400
        
        if new_status == 'fulfilled' and not is_victim:
            return jsonify({'error': 'Only the victim can mark request as fulfilled'}), 403
        
        # Update request
        update_data = {
            'status': new_status,
            'updated_at': datetime.utcnow()
        }
        
        if new_status == 'fulfilled':
            update_data['fulfilled_at'] = datetime.utcnow()
        elif new_status == 'pending':
            # Reset volunteer assignment
            update_data['volunteer_id'] = None
            update_data['volunteer_name'] = None
            update_data['volunteer_phone'] = None
            update_data['volunteer_distance'] = None
        
        requests_collection.update_one(
            {'_id': ObjectId(request_id)},
            {'$set': update_data}
        )
        
        return jsonify({'message': 'Request status updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Map and suggestions
@app.route('/map/data', methods=['GET'])
@require_auth
def get_map_data():
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get query parameters
        help_type = request.args.get('type')
        urgency = request.args.get('urgency')
        max_distance = request.args.get('max_distance', type=float)
        
        # Build filter
        filter_query = {'status': 'pending'}
        
        if help_type:
            filter_query['type'] = help_type
        
        if urgency:
            filter_query['urgency'] = urgency
        
        # Get requests
        requests = list(requests_collection.find(filter_query))
        
        # Calculate distances and prepare map data
        user_location = user.get('location', {})
        map_data = []
        
        for req in requests:
            req_location = req.get('location', {})
            if not (req_location.get('latitude') and req_location.get('longitude')):
                continue
            
            distance = None
            if user_location.get('latitude') and user_location.get('longitude'):
                distance = calculate_distance(
                    user_location['latitude'], user_location['longitude'],
                    req_location['latitude'], req_location['longitude']
                )
            
            # Filter by distance if specified
            if max_distance and distance and distance > max_distance:
                continue
            
            map_data.append({
                'id': str(req['_id']),
                'type': req['type'],
                'urgency': req['urgency'],
                'description': req['description'][:100] + '...' if len(req['description']) > 100 else req['description'],
                'location': req_location,
                'distance': round(distance, 2) if distance else None,
                'created_at': req['created_at'].isoformat()
            })
        
        # Sort by distance if available
        if user_location.get('latitude') and user_location.get('longitude'):
            map_data.sort(key=lambda x: x.get('distance', float('inf')))
        
        return jsonify({
            'requests': map_data,
            'user_location': user_location
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/suggestions', methods=['GET'])
@require_auth
def get_suggestions():
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user['role'] != 'volunteer':
            return jsonify({'error': 'Only volunteers can get suggestions'}), 403
        
        user_location = user.get('location', {})
        if not (user_location.get('latitude') and user_location.get('longitude')):
            return jsonify({'error': 'Location is required for suggestions'}), 400
        
        # Get user skills
        user_skills = user.get('skills', [])
        
        # Get all pending requests
        requests = list(requests_collection.find({'status': 'pending'}))
        
        suggestions = []
        for req in requests:
            req_location = req.get('location', {})
            if not (req_location.get('latitude') and req_location.get('longitude')):
                continue
            
            distance = calculate_distance(
                user_location['latitude'], user_location['longitude'],
                req_location['latitude'], req_location['longitude']
            )
            
            # Calculate relevance score
            score = 0
            
            # Distance score (closer = higher score)
            if distance <= 5:
                score += 50
            elif distance <= 15:
                score += 30
            elif distance <= 30:
                score += 15
            else:
                score += 0
            
            # Urgency score
            urgency_scores = {'high': 30, 'medium': 20, 'low': 10}
            score += urgency_scores.get(req['urgency'], 0)
            
            # Skills match score
            if user_skills and req['type'] in user_skills:
                score += 20
            
            # Time score (newer requests get slight boost)
            hours_old = (datetime.utcnow() - req['created_at']).total_seconds() / 3600
            if hours_old < 2:
                score += 10
            elif hours_old < 6:
                score += 5
            
            suggestions.append({
                'id': str(req['_id']),
                'type': req['type'],
                'urgency': req['urgency'],
                'description': req['description'],
                'victim_name': req['victim_name'],
                'location': req_location,
                'distance': round(distance, 2),
                'score': score,
                'created_at': req['created_at'].isoformat()
            })
        
        # Sort by score (highest first)
        suggestions.sort(key=lambda x: x['score'], reverse=True)
        
        # Return top 10 suggestions
        return jsonify(suggestions[:10]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Health check
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()}), 200

if __name__ == '__main__':
    app.run(debug=True)