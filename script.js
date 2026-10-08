const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyT7FmeWH4xVgPjtIYVFV50dnkdfPf71Zo5sgAPZ_IIzY6vc4DDPPiJhwnmmIlrIfDJ/exec";

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQiepjUhDQl3nTI_NkU6b88_P-_nb_Rg4k1gzlLjwMqkxdzD1DV4z3zCkkVjtFKx_UM2SZiww1FyZKT/pub?gid=0&single=true&output=csv";

//code that reads the Sheet
fetch(SHEET_URL)
    .then(response => response.text())
    .then(csv => {

        const rows = csv.trim().split("\n");

        // Remove the header row
        rows.shift();

        rows.forEach(row => {

            const values = row.split(",");

            const latitude = parseFloat(values[0]);
            const longitude = parseFloat(values[1]);

            const title = values[2];
            const comment = values[3];
            const author = values[4];
            const date = values[5];

            // Create a marker
            const marker = L.marker([
                latitude,
                longitude
            ]).addTo(map);

            // Add information to the marker
            marker.bindPopup(
                "<h3>" + title + "</h3>" +
                "<p>" + comment + "</p>" +
                "<p><em>— " + author + "</em></p>" +
                "<small>" + date + "</small>"
            );

        });

    })
    .catch(error => {
        console.error("Could not load Google Sheet:", error);
    });


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


    const popupContent =
        "<h3>Add a memory</h3>" +

        "<p>" +
        "<strong>Latitude:</strong> " + latitude.toFixed(5) + "<br>" +
        "<strong>Longitude:</strong> " + longitude.toFixed(5) +
        "</p>" +

        "<label>" +
        "Place name:<br>" +
        "<input type='text' id='place-name'>" +
        "</label>" +

        "<br><br>" +

        "<label>" +
        "Your memory:<br>" +
        "<textarea id='place-comment'></textarea>" +
        "</label>" +

        "<br><br>" +

        "<label>" +
        "Your name:<br>" +
        "<input type='text' id='place-author'>" +
        "</label>" +

        "<br><br>" +

        "<button id='add-place'>" +
        "Add place" +
        "</button>";


    L.popup()
        .setLatLng(event.latlng)
        .setContent(popupContent)
        .openOn(map);

});

document.addEventListener("click", function(event) {

    if (event.target.id !== "add-place") {
        return;
    }


    // Get information from the form

    const title =
        document.getElementById("place-name").value;

    const comment =
        document.getElementById("place-comment").value;

    const author =
        document.getElementById("place-author").value;


    // Get the coordinates of the clicked location

    const popup = map._popup;

    const latitude =
        popup.getLatLng().lat;

    const longitude =
        popup.getLatLng().lng;


    // Create the form that sends data to Google Apps Script

    const form = document.createElement("form");

    form.method = "GET";
    form.action = SCRIPT_URL;
    form.target = "hiddenFrame";


    function addField(name, value) {

        const input = document.createElement("input");

        input.type = "hidden";
        input.name = name;
        input.value = value;

        form.appendChild(input);
    }


    addField("latitude", latitude);
    addField("longitude", longitude);
    addField("title", title);
    addField("comment", comment);
    addField("author", author);


    document.body.appendChild(form);

    form.submit();

    form.remove();


// Close the form popup

map.closePopup();


// Tell the user that the memory was saved

L.popup()
    .setLatLng([latitude, longitude])
    .setContent(
        "<h3>Memory saved 🌿</h3>" +
        "<p>Your memory has been added.</p>" +
        "<p><em>Refresh the page to see it on the map.</em></p>"
    )
    .openOn(map);
