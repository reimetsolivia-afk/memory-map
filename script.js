// Google Apps Script URL
const SCRIPT_URL = "YOUR_APPS_SCRIPT_URL";

// Published Google Sheet CSV URL
const SHEET_URL = "YOUR_PUBLISHED_SHEET_CSV_URL";

// Store the invitation code entered by the visitor
let invitationCode = "";


// Get the login elements
const login = document.getElementById("login");
const site = document.getElementById("site");
const codeInput = document.getElementById("invite-code");
const enterButton = document.getElementById("enter-map");
const loginMessage = document.getElementById("login-message");


// --------------------------------------------------
// INVITATION CODE
// --------------------------------------------------

enterButton.addEventListener("click", function () {

    // Get the code entered by the visitor
    invitationCode = codeInput.value.trim();

    // Don't continue if nothing was entered
    if (invitationCode === "") {

        loginMessage.textContent =
            "Please enter an invitation code.";

        return;
    }


    // Show the map
    login.style.display = "none";
    site.style.display = "block";


    // Tell Leaflet that the map is now visible
    map.invalidateSize();

});


// --------------------------------------------------
// CREATE THE MAP
// --------------------------------------------------

const map = L.map("map").setView(
    [59.437, 24.753],
    12
);


// --------------------------------------------------
// ADD OPENSTREETMAP TILES
// --------------------------------------------------

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {

        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

    }
).addTo(map);


// --------------------------------------------------
// READ DATA FROM GOOGLE SHEET
// --------------------------------------------------

fetch(SHEET_URL)

    .then(response => response.text())

    .then(csv => {


        // --------------------------------------------------
        // CSV PARSER
        // --------------------------------------------------

        // This allows comments to contain commas
        // and line breaks without breaking the table.

        function parseCSV(csv) {

            const rows = [];

            let row = [];
            let value = "";
            let insideQuotes = false;


            for (let i = 0; i < csv.length; i++) {

                const character = csv[i];
                const nextCharacter = csv[i + 1];


                // Two quotation marks inside a quoted field
                // represent one quotation mark.

                if (
                    character === '"' &&
                    insideQuotes &&
                    nextCharacter === '"'
                ) {

                    value += '"';

                    i++;

                }


                // Start or end of a quoted field

                else if (character === '"') {

                    insideQuotes = !insideQuotes;

                }


                // Comma separates columns,
                // unless we are inside quotation marks.

                else if (
                    character === "," &&
                    !insideQuotes
                ) {

                    row.push(value);

                    value = "";

                }


                // New line separates rows,
                // unless we are inside quotation marks.

                else if (
                    (character === "\n" ||
                     character === "\r") &&
                    !insideQuotes
                ) {


                    // Handle Windows-style line endings
                    // (\r\n)

                    if (
                        character === "\r" &&
                        nextCharacter === "\n"
                    ) {

                        i++;

                    }


                    row.push(value);

                    value = "";


                    // Ignore completely empty rows

                    if (
                        row.some(
                            cell => cell.trim() !== ""
                        )
                    ) {

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


            if (
                row.some(
                    cell => cell.trim() !== ""
                )
            ) {

                rows.push(row);

            }


            return rows;

        }


        // Parse the CSV

        const rows = parseCSV(csv);


        // Remove the header row

        rows.shift();


        // --------------------------------------------------
        // CREATE MARKERS
        // --------------------------------------------------

        rows.forEach(row => {


            // Column 1 = latitude
            // Column 2 = longitude

            const latitude =
                parseFloat(row[0]);

            const longitude =
                parseFloat(row[1]);


            // Ignore rows without valid coordinates

            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
            ) {

                console.warn(
                    "Skipping invalid row:",
                    row
                );

                return;

            }


            // Get the other columns

            const title =
                row[2] || "";

            const comment =
                row[3] || "";

            const author =
                row[4] || "";

            const date =
                row[5] || "";


            // --------------------------------------------------
            // CREATE MARKER
            // --------------------------------------------------

            const marker = L.marker([
                latitude,
                longitude
            ]).addTo(map);


            // --------------------------------------------------
            // ADD POPUP
            // --------------------------------------------------

            marker.bindPopup(

                "<h3>" +
                title +
                "</h3>" +

                "<p style='white-space: pre-line;'>" +
                comment +
                "</p>" +

                "<p><em>— " +
                author +
                "</em></p>" +

                "<small>" +
                date +
                "</small>"

            );

        });

    })


    // --------------------------------------------------
    // ERROR HANDLING
    // --------------------------------------------------

    .catch(error => {

        console.error(
            "Could not load Google Sheet:",
            error
        );

    });


// --------------------------------------------------
// MAP CLICK
// --------------------------------------------------

map.on("click", function (event) {


    // Get coordinates of clicked location

    const latitude =
        event.latlng.lat;

    const longitude =
        event.latlng.lng;


    // --------------------------------------------------
    // CREATE POPUP FORM
    // --------------------------------------------------

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


    // Open the popup

    L.popup()

        .setLatLng(event.latlng)

        .setContent(popupContent)

        .openOn(map);

});


// --------------------------------------------------
// ADD PLACE BUTTON
// --------------------------------------------------

document.addEventListener(
    "click",
    function (event) {


        // Only continue if the clicked element
        // is the Add place button.

        if (
            event.target.id !== "add-place"
        ) {

            return;

        }


        // --------------------------------------------------
        // GET FORM INFORMATION
        // --------------------------------------------------

        const title =
            document.getElementById(
                "place-name"
            ).value;

        const comment =
            document.getElementById(
                "place-comment"
            ).value;

        const author =
            document.getElementById(
                "place-author"
            ).value;


        // --------------------------------------------------
        // GET COORDINATES
        // --------------------------------------------------

        // Get the popup that is currently open.

        const popup = map._popup;


        const latitude =
            popup.getLatLng().lat;

        const longitude =
            popup.getLatLng().lng;


        // --------------------------------------------------
        // CREATE FORM
        // --------------------------------------------------

        // We use a normal HTML form instead of fetch()
        // because Google Apps Script can cause CORS problems
        // when JavaScript tries to read its response.

        const form =
            document.createElement("form");


        form.method = "GET";

        form.action = SCRIPT_URL;

        form.target = "hiddenFrame";


        // --------------------------------------------------
        // FUNCTION FOR ADDING HIDDEN FIELDS
        // --------------------------------------------------

        function addField(name, value) {

            const input =
                document.createElement("input");


            input.type = "hidden";

            input.name = name;

            input.value = value;


            form.appendChild(input);

        }


        // --------------------------------------------------
        // ADD DATA TO FORM
        // --------------------------------------------------

        addField(
            "latitude",
            latitude
        );

        addField(
            "longitude",
            longitude
        );

        addField(
            "title",
            title
        );

        addField(
            "comment",
            comment
        );

        addField(
            "author",
            author
        );


        // IMPORTANT:
        // Send the invitation code to Google Apps Script.

        addField(
            "code",
            invitationCode
        );


        // --------------------------------------------------
        // SUBMIT FORM
        // --------------------------------------------------

        document.body.appendChild(form);

        form.submit();

        form.remove();


        // --------------------------------------------------
        // CLOSE FORM POPUP
        // --------------------------------------------------

        map.closePopup();


        // --------------------------------------------------
        // SHOW CONFIRMATION
        // --------------------------------------------------

        L.popup()

            .setLatLng([
                latitude,
                longitude
            ])

            .setContent(

                "<h3>Memory submitted 🌿</h3>" +

                "<p>" +

                "Your memory has been submitted." +

                "</p>" +

                "<p>" +

                "<em>" +

                "Refresh the page to see it on the map." +

                "</em>" +

                "</p>"

            )

            .openOn(map);

    }
);
