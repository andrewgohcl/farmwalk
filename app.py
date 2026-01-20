from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from flask_talisman import Talisman
from shapely.geometry import Polygon
from pyproj import Geod
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Enforce HTTPS in production
import os
if os.environ.get('ENVIRONMENT') == 'production':
    Talisman(app, content_security_policy=None)

# Initialize WGS84 ellipsoid for geodesic calculations
geod = Geod(ellps='WGS84')

def round_coordinates(coords, precision=6):
    """Round coordinates to specified decimal places"""
    return [[round(lon, precision), round(lat, precision)] for lon, lat in coords]

@app.route('/')
def index():
    """Serve the main application page"""
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate_area():
    """
    Calculate geodesic area from GPS coordinates
    Expects JSON: {"coordinates": [[lat, lng], [lat, lng], ...]}
    Returns GeoJSON FeatureCollection with area in hectares
    """
    try:
        data = request.get_json()
        coordinates = data.get('coordinates', [])
        
        if len(coordinates) < 3:
            return jsonify({'error': 'At least 3 coordinates required'}), 400
        
        # Convert [lat, lng] to [lng, lat] for GeoJSON format
        geojson_coords = [[lng, lat] for lat, lng in coordinates]
        
        # Round to 6 decimal places
        geojson_coords = round_coordinates(geojson_coords, 6)
        
        # Close the polygon by appending first coordinate
        if geojson_coords[0] != geojson_coords[-1]:
            geojson_coords.append(geojson_coords[0])
        
        # Create Shapely polygon for validation
        polygon = Polygon(geojson_coords)
        
        if not polygon.is_valid:
            return jsonify({'error': 'Invalid polygon geometry'}), 400
        
        # Calculate geodesic area using Pyproj
        # Extract lon, lat arrays
        lons = [coord[0] for coord in geojson_coords]
        lats = [coord[1] for coord in geojson_coords]
        
        # Calculate area (returns in square meters)
        area_m2, _ = geod.polygon_area_perimeter(lons, lats)
        area_m2 = abs(area_m2)  # Take absolute value
        
        # Convert to hectares (1 ha = 10,000 m²)
        area_ha = round(area_m2 / 10000, 4)
        
        # Generate GeoJSON FeatureCollection
        geojson = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [geojson_coords]
                },
                "properties": {
                    "area_ha": area_ha,
                    "area_m2": round(area_m2, 2),
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "coordinate_count": len(coordinates)
                }
            }]
        }
        
        return jsonify(geojson)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/verify', methods=['POST'])
def verify_geojson():
    """
    Verify and extract polygon data from uploaded GeoJSON
    Returns polygon coordinates for visualization
    """
    try:
        data = request.get_json()
        geojson_data = data.get('geojson', {})
        
        # Extract first polygon feature
        if geojson_data.get('type') == 'FeatureCollection':
            features = geojson_data.get('features', [])
            if not features:
                return jsonify({'error': 'No features found in GeoJSON'}), 400
            
            geometry = features[0].get('geometry', {})
        elif geojson_data.get('type') == 'Feature':
            geometry = geojson_data.get('geometry', {})
        else:
            geometry = geojson_data
        
        if geometry.get('type') != 'Polygon':
            return jsonify({'error': 'Only Polygon geometry supported'}), 400
        
        coordinates = geometry.get('coordinates', [[]])[0]
        
        if len(coordinates) < 3:
            return jsonify({'error': 'Invalid polygon coordinates'}), 400
        
        # Convert [lng, lat] to [lat, lng] for Leaflet
        leaflet_coords = [[lat, lng] for lng, lat in coordinates]
        
        return jsonify({
            'coordinates': leaflet_coords,
            'properties': geojson_data.get('features', [{}])[0].get('properties', {}) if geojson_data.get('type') == 'FeatureCollection' else {}
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run in development mode
    # For production, use a proper WSGI server and enable Talisman
    app.run(debug=True, host='0.0.0.0', port=5000)
