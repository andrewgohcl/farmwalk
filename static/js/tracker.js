// ===== State Management =====
const AppState = {
    IDLE: 'idle',
    RECORDING: 'recording',
    PAUSED: 'paused',
    FINISHED: 'finished'
};

let currentState = AppState.IDLE;
let coordinates = [];
let lastSavedPosition = null;
let watchId = null;
let wakeLock = null;

// ===== Map Initialization =====
const map = L.map('map', {
    zoomControl: true,
    attributionControl: true
}).setView([0, 0], 2);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
}).addTo(map);

// Map layers
let trackingPolyline = null;
let userMarker = null;
let uploadedPolygon = null;

// ===== DOM Elements =====
const mainActionBtn = document.getElementById('main-action-btn');
const pauseResumeBtn = document.getElementById('pause-resume-btn');
const startIcon = document.getElementById('start-icon');
const finishIcon = document.getElementById('finish-icon');
const pauseIcon = document.getElementById('pause-icon');
const resumeIcon = document.getElementById('resume-icon');

const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const areaValue = document.getElementById('area-value');
const pointCount = document.getElementById('point-count');
const statusText = document.getElementById('status-text');
const errorModal = document.getElementById('error-modal');
const errorTitle = document.getElementById('error-title');
const errorMessage = document.getElementById('error-message');
const errorClose = document.getElementById('error-close');

// ... [Keep utility functions same] ...

function updateUI() {
    // Update point count and area
    pointCount.textContent = `${coordinates.length} points`;

    if (coordinates.length >= 3) {
        const estimatedArea = estimateArea();
        areaValue.textContent = `~${estimatedArea.toFixed(2)} ha`;
    } else {
        areaValue.textContent = '0.00 ha';
    }

    // Button Logic
    switch (currentState) {
        case AppState.IDLE:
            // Main: Start (Green)
            mainActionBtn.classList.remove('recording');
            startIcon.style.display = 'block';
            finishIcon.style.display = 'none';
            mainActionBtn.title = "Start Recording";

            // Side: Hidden
            pauseResumeBtn.style.display = 'none';

            statusText.textContent = 'Tap play to start recording';
            break;

        case AppState.RECORDING:
            // Main: Finish (Red)
            mainActionBtn.classList.add('recording');
            startIcon.style.display = 'none';
            finishIcon.style.display = 'block';
            mainActionBtn.title = "Finish Walk";

            // Side: Pause (Visible)
            pauseResumeBtn.style.display = 'flex';
            pauseResumeBtn.classList.remove('active');
            pauseIcon.style.display = 'block';
            resumeIcon.style.display = 'none';
            pauseResumeBtn.title = "Pause Recording";

            statusText.textContent = 'Recording... Walk the perimeter';
            break;

        case AppState.PAUSED:
            // Main: Finish (Red)
            mainActionBtn.classList.add('recording');
            startIcon.style.display = 'none';
            finishIcon.style.display = 'block';
            mainActionBtn.title = "Finish Walk";

            // Side: Resume (Visible, Active style)
            pauseResumeBtn.style.display = 'flex';
            pauseResumeBtn.classList.add('active'); // Maybe yellow/accent?
            pauseIcon.style.display = 'none';
            resumeIcon.style.display = 'block';
            pauseResumeBtn.title = "Resume Recording";

            statusText.textContent = 'Paused - Tap resume to continue';
            break;

        case AppState.FINISHED:
            statusText.textContent = 'Walk completed! Saving...';
            break;
    }
}

// ... [Keep error helpers and wake lock same] ...

// ===== State Transitions =====
function resetToIdle() {
    currentState = AppState.IDLE;
    coordinates = [];
    lastSavedPosition = null;

    stopTracking();

    if (trackingPolyline) {
        map.removeLayer(trackingPolyline);
        trackingPolyline = null;
    }

    if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
    }

    updateUI();
}

// ===== Event Handlers =====

mainActionBtn.addEventListener('click', async () => {
    if (currentState === AppState.IDLE) {
        // ACTION: START
        currentState = AppState.RECORDING;
        startTracking();
        updateUI();
    } else if (currentState === AppState.RECORDING || currentState === AppState.PAUSED) {
        // ACTION: FINISH
        if (coordinates.length < 3) {
            showError('Insufficient Points', 'Please record at least 3 points before finishing.');
            return;
        }
        await finishWalk();
    }
});

pauseResumeBtn.addEventListener('click', () => {
    if (currentState === AppState.RECORDING) {
        // ACTION: PAUSE
        currentState = AppState.PAUSED;
        updateUI();
    } else if (currentState === AppState.PAUSED) {
        // ACTION: RESUME
        currentState = AppState.RECORDING;
        startTracking(); // Ensure tracking is active (some browsers might stop it)
        updateUI();
    }
});

async function finishWalk() { // Extracted finish logic
    currentState = AppState.FINISHED;
    stopTracking();
    updateUI();

    // Create GeoJSON with polygon coordinates (for immediate download)
    const localGeoJSON = {
        type: "FeatureCollection",
        features: [{
            type: "Feature",
            properties: {
                timestamp: new Date().toISOString(),
                point_count: coordinates.length
            },
            geometry: {
                type: "Polygon",
                coordinates: [[...coordinates, coordinates[0]]] // Close the polygon
            }
        }]
    };

    // Download GeoJSON immediately (works even if server is asleep)
    const blob = new Blob([JSON.stringify(localGeoJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `farm-plot-${new Date().toISOString().split('T')[0]}.geojson`;
    a.click();
    URL.revokeObjectURL(url);

    statusText.textContent = 'Polygon saved! Calculating area...';

    // Now try to get accurate calculation from server
    try {
        const response = await fetch('/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ coordinates })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Calculation failed');
        }

        const geojson = await response.json();

        // Update area with accurate calculation
        const accurateArea = geojson.features[0].properties.area_ha;
        areaValue.textContent = `${accurateArea} ha`;

        statusText.textContent = 'Area calculated! Tap start to map new plot';

    } catch (err) {
        console.warn('Server calculation failed:', err.message);
        statusText.textContent = 'Polygon saved! Upload file later for area calculation.';
    }

    // Reset after 3 seconds
    setTimeout(() => {
        resetToIdle();
    }, 3000);
}


uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const geojson = JSON.parse(text);

        // Send to backend for verification
        const response = await fetch('/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ geojson })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Verification failed');
        }

        const data = await response.json();

        // Remove existing uploaded polygon
        if (uploadedPolygon) {
            map.removeLayer(uploadedPolygon);
        }

        // Add polygon to map in red
        uploadedPolygon = L.polygon(data.coordinates, {
            color: '#EF4444',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.2
        }).addTo(map);

        // Fit map to polygon
        map.fitBounds(uploadedPolygon.getBounds());

        statusText.textContent = 'Uploaded plot displayed in red';

        // Show area if available
        if (data.properties && data.properties.area_ha) {
            showError('Plot Loaded', `Area: ${data.properties.area_ha} hectares`);
        }

    } catch (err) {
        showError('Upload Error', `Failed to load GeoJSON file: ${err.message}`);
    }

    // Reset file input
    fileInput.value = '';
});

errorClose.addEventListener('click', hideError);

// ===== Initialization =====
updateUI();

// Handle page visibility changes (re-acquire wake lock)
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});
