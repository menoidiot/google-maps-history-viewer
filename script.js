document.addEventListener("DOMContentLoaded", () => {
    let map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let markers = [];
    let locationData = [];

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
                displayLocations(locationData);
            };
            reader.readAsText(file);
        }
    });

    function displayLocations(data) {
        markers.forEach(marker => map.removeLayer(marker));
        markers = data.map(loc => L.marker([loc.lat, loc.lng]).addTo(map));
        if (data.length) {
            map.setView([data[0].lat, data[0].lng], 10);
        }
    }

    window.filterData = function() {
        let startDate = new Date(document.getElementById("startDate").value);
        let endDate = new Date(document.getElementById("endDate").value);
        
        let filtered = locationData.filter(loc => loc.timestamp >= startDate && loc.timestamp <= endDate);
        displayLocations(filtered);
    };
});
