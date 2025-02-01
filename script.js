document.addEventListener("DOMContentLoaded", () => {
    let map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let markers = L.markerClusterGroup();
    let heatLayer = L.heatLayer([], { radius: 15 }).addTo(map);
    let routeLine = L.polyline([], { color: 'blue' }).addTo(map);
    let locationData = [];
    let animatedMarker;
    let animationIndex = 0;

    // Load previous data from LocalStorage
    if (localStorage.getItem("locationData")) {
        locationData = JSON.parse(localStorage.getItem("locationData"));
        displayLocations(locationData);
    }

    document.getElementById("fileInput").addEventListener("change", function(event) {
        let file = event.target.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = function(e) {
                let jsonData = JSON.parse(e.target.result);
                locationData = jsonData.locations.map(loc => ({
                    lat: loc.latitudeE7 / 1e7,
                    lng: loc.longitudeE7 / 1e7,
                    timestamp: new Date(parseInt(loc.timestampMs))
                }));
                localStorage.setItem("locationData", JSON.stringify(locationData));
                displayLocations(locationData);
            };
            reader.readAsText(file);
        }
    });

    function displayLocations(data) {
        markers.clearLayers();
        heatLayer.setLatLngs([]);
        routeLine.setLatLngs([]);
        
        let heatData = [];
        let totalDistance = 0;
        let lastPoint = null;

        data.forEach(loc => {
            let marker = L.marker([loc.lat, loc.lng]);
            marker.bindPopup(`📍 Location<br>🕒 ${loc.timestamp.toLocaleString()}`);
            markers.addLayer(marker);
            heatData.push([loc.lat, loc.lng, 0.5]); // Third value is intensity
            routeLine.addLatLng([loc.lat, loc.lng]);

            if (lastPoint) {
                totalDistance += getDistance(lastPoint, loc);
            }
            lastPoint = loc;
        });

        heatLayer.setLatLngs(heatData);
        map.addLayer(markers);

        if (data.length) {
            map.setView([data[0].lat, data[0].lng], 10);
        }

        document.getElementById("stats").innerHTML = `📏 Total Distance: ${totalDistance.toFixed(2)} km`;
    }

    window.filterData = function() {
        let startDate = new Date(document.getElementById("startDate").value);
        let endDate = new Date(document.getElementById("endDate").value);
        
        let filtered = locationData.filter(loc => loc.timestamp >= startDate && loc.timestamp <= endDate);
        displayLocations(filtered);
    };

    window.startAnimation = function() {
        if (!locationData.length) return alert("Upload data first!");

        if (animatedMarker) map.removeLayer(animatedMarker);
        animationIndex = 0;

        animatedMarker = L.marker([locationData[0].lat, locationData[0].lng], { opacity: 0.9 }).addTo(map);

        function animateMarker() {
            if (animationIndex < locationData.length) {
                let loc = locationData[animationIndex];
                animatedMarker.setLatLng([loc.lat, loc.lng]);
                map.setView([loc.lat, loc.lng], 12);
                animationIndex++;
                setTimeout(animateMarker, 100); // Adjust speed here
            }
        }

        animateMarker();
    };

    document.getElementById("heatmapToggle").addEventListener("change", function() {
        if (this.checked) {
            map.addLayer(heatLayer);
        } else {
            map.removeLayer(heatLayer);
        }
    });

    function getDistance(point1, point2) {
        const R = 6371; // Earth radius in km
        const dLat = toRad(point2.lat - point1.lat);
        const dLng = toRad(point2.lng - point1.lng);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    function toRad(degrees) {
        return degrees * (Math.PI / 180);
    }
});