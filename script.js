const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyT7FmeWH4xVgPjtIYVFV50dnkdfPf71Zo5sgAPZ_IIzY6vc4DDPPiJhwnmmIlrIfDJ/exec";

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQiepjUhDQl3nTI_NkU6b88_P-_nb_Rg4k1gzlLjwMqkxdzD1DV4z3zCkkVjtFKx_UM2SZiww1FyZKT/pub?gid=0&single=true&output=csv";

let invitationCode = "";

const login = document.getElementById("login");
const site = document.getElementById("site");
const codeInput = document.getElementById("invite-code");
const enterButton = document.getElementById("enter-map");
const loginMessage = document.getElementById("login-message");


enterButton.addEventListener("click", function() {

    invitationCode = codeInput.value.trim();

    if (invitationCode === "") {
        loginMessage.textContent = "Please enter an invitation code.";
        return;
    }

    // the will map load after a code is entered.
    // The Apps Script will verify the code when a memory is saved.
    login.style.display = "none";
    site.style.display = "block";

    // tells Leaflet that the map container is now visible
    map.invalidateSize();
});

// Create the map

const map = L.map("map").setView([59.437, 24.753], 12);


// Add OpenStreetMap tiles

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {

    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

}).addTo(map);

// Read the Google Sheet
fetch(SHEET_URL)
    .then(response => response.text())
    .then(csv => {

        //commas and enter inside the comment part don't  mess it up
       function parseCSV(csv) {

            const rows = [];
            let row = [];
            let value = "";
            let insideQuotes = false;
        
            for (let i = 0; i < csv.length; i++) {
        
                const character = csv[i];
                const nextCharacter = csv[i + 1];
        
                // A pair of quotes inside a quoted field
                // represents one quote character
                if (character === '"' && insideQuotes && nextCharacter === '"') {
        
                    value += '"';
                    i++;
                }
        
                // Start or end of a quoted field
                else if (character === '"') {
        
                    insideQuotes = !insideQuotes;
                }
        
                // Comma separates columns,
                // unless we are inside quotation marks
                else if (character === "," && !insideQuotes) {
        
                    row.push(value);
                    value = "";
                }
        
                // Newline separates rows,
                // unless we are inside quotation marks
                else if (
                    (character === "\n" || character === "\r") &&
                    !insideQuotes
                ) {
        
                    // Handle Windows-style line endings: \r\n
                    if (character === "\r" && nextCharacter === "\n") {
                        i++;
                    }
        
                    row.push(value);
                    value = "";
        
                    // Ignore completely empty rows
                    if (row.some(cell => cell.trim() !== "")) {
                        rows.push(row);
                    }
        
                    row = [];
                }
        
                // Normal character
                else {
        
                    value += character;
                }
            }
        
            // Add the final row
            row.push(value);
        
            if (row.some(cell => cell.trim() !== "")) {
                rows.push(row);
            }
        
            return rows;
        }


        const rows = parseCSV(csv);

        // Remove the header row
        rows.shift();

        // Create a marker for each row
        rows.forEach(row => {

            const latitude = parseFloat(row[0]);
            const longitude = parseFloat(row[1]);

            // Skip rows without valid coordinates
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                console.warn("Skipping invalid row:", row);
                return;
            }

            const title = row[2] || "";
            const comment = row[3] || "";
            const author = row[4] || "";
            const date = row[5] || "";

            // Create marker
            const marker = L.marker([
                latitude,
                longitude
            ]).addTo(map);

            // Add popup
            marker.bindPopup(
                "<h3>" + title + "</h3>" +
                "<p style='white-space: pre-line;'>" + comment + "</p>" +
                "<p><em>— " + author + "</em></p>" +
                "<small>" + date + "</small>"
            );

        });

    })
    .catch(error => {
        console.error("Could not load Google Sheet:", error);
    });


// Listen for clicks on the map

map.on("click", function(event) {

    const latitude = event.latlng.lat;
    const longitude = event.latlng.lng;


    const popupContent =
        "<h3>Add a memory</h3>" +

        "<p>" +
        "<strong>Latitude:</strong> " +
        latitude.toFixed(5) +
        "<br>" +
        "<strong>Longitude:</strong> " +
        longitude.toFixed(5) +
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


// Listen for the Add place button

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


    // Get coordinates of the clicked location

    const popup = map._popup;

    const latitude =
        popup.getLatLng().lat;

    const longitude =
        popup.getLatLng().lng;


    // Create form for Google Apps Script

    const form = document.createElement("form");

    form.method = "GET";
    form.action = SCRIPT_URL;
    form.target = "hiddenFrame";


    // Function for adding hidden form fields

    function addField(name, value) {

        const input = document.createElement("input");

        input.type = "hidden";
        input.name = name;
        input.value = value;

        form.appendChild(input);
    }


    // Add the memory information

    addField("latitude", latitude);
    addField("longitude", longitude);
    addField("title", title);
    addField("comment", comment);
    addField("author", author);


    // Send the form

    document.body.appendChild(form);

    form.submit();

    form.remove();


    // Close the form popup

    map.closePopup();


    // Tell the user the memory was saved

    L.popup()
        .setLatLng([latitude, longitude])
        .setContent(
            "<h3>Memory saved 🌿</h3>" +
            "<p>Your memory has been added.</p>" +
            "<p><em>Refresh the page to see it on the map.</em></p>"
        )
        .openOn(map);

});
