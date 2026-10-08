// Create the map

const map = L.map("map").setView([59.437, 24.753], 12);


// Add OpenStreetMap tiles

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {

    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

}).addTo(map);


// Listen for clicks on the map

map.on("click", function(event) {

    const latitude = event.latlng.lat;
    const longitude = event.latlng.lng;


    // Create a popup

    const popupContent = `
        <h3>Add a memory</h3>

        <p>
            <strong>Latitude:</strong> ${latitude.toFixed(5)}<br>
            <strong>Longitude:</strong> ${longitude.toFixed(5)}
        </p>

        <label>
            Place name:<br>
            <input type="text" id="place-name">
        </label>

        <br><br>

        <label>
            Your memory:<br>
            <textarea id="place-comment"></textarea>
        </label>

        <br><br>

        <label>
            Your name:<br>
            <input type="text" id="place-author">
        </label>

        <br><br>

        <button id="add-place">
            Add place
        </button>
    `;


    L.popup()
        .setLatLng(event.latlng)
        .setContent(popupContent)
        .openOn(map);

});
```
