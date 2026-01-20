# FarmPlotter 🌾

A mobile-first web application for small-scale farmers to map their plots by walking the perimeter. Real-time GPS tracking, accurate geodesic area calculation, and GeoJSON export for EUDR/FSC compliance.

## Features

- 📍 **Real-time GPS Tracking** with 3-meter jitter filtering
- 📐 **Geodesic Area Calculation** using WGS84 ellipsoid
- 📄 **GeoJSON Export** with 6 decimal place precision
- 📤 **File Upload** for plot verification
- 📱 **Mobile-First Design** with premium UI
- 🔒 **Screen Wake Lock** to keep display on during recording

## Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py
```

Access at `http://127.0.0.1:5000`

> **Note**: GPS requires HTTPS. For local testing with GPS, use ngrok:
> ```bash
> ngrok http 5000
> ```

### Production Deployment

```bash
# Install dependencies including gunicorn
pip install -r requirements.txt

# Set environment variable
export ENVIRONMENT=production

# Run with gunicorn
gunicorn -c gunicorn_config.py app:app
```

## Tech Stack

- **Backend**: Python 3, Flask, Shapely, Pyproj
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Mapping**: Leaflet.js with OpenStreetMap
- **Deployment**: Gunicorn WSGI server

## License

MIT
