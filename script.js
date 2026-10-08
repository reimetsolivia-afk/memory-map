// Google Apps Script URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyT7FmeWH4xVgPjtIYVFV50dnkdfPf71Zo5sgAPZ_IIzY6vc4DDPPiJhwnmmIlrIfDJ/exec";

// Published Google Sheet CSV URL
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQiepjUhDQl3nTI_NkU6b88_P-_nb_Rg4k1gzlLjwMqkxdzD1DV4z3zCkkVjtFKx_UM2SZiww1FyZKT/pub?gid=0&single=true&output=csv";

// Store all memory locations
const memories = [];

// Store the route currently displayed on the map
let roadtripRoute = null;

// CREATE THE MAP

const map = L.map("map").setView(
    [59.437, 24.753],
    12
);


// ADD OPENSTREETMAP TILES

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {

        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

    }
).addTo(map);


// READ DATA FROM GOOGLE SHEET

fetch(SHEET_URL)

    .then(response => response.text())

    .then(csv => {


        // CSV PARSER

        // This allows comments to contain commas
        // and line breaks.

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


        // CREATE A MARKER FOR EACH ROW


        rows.forEach(row => {


            // Column 1 = latitude

            const latitude =
                parseFloat(row[0]);


            // Column 2 = longitude

            const longitude =
                parseFloat(row[1]);


            // Skip rows without valid coordinates

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


            // Column 3 = title

            const title =
                row[2] || "";


            // Column 4 = comment

            const comment =
                row[3] || "";


            // Column 5 = author

            const author =
                row[4] || "";


            // Column 6 = date

            const date =
                row[5] || "";

            // CREATE MARKER

            const marker = L.marker([
                latitude,
                longitude
            ]).addTo(map);

            memories.push({
                latitude: latitude,
                longitude: longitude
            });


            // ADD POPUP


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


    // ERROR HANDLING

    .catch(error => {

        console.error(
            "Could not load Google Sheet:",
            error
        );

    });


// LISTEN FOR MAP CLICKS

map.on("click", function (event) {


    // Get coordinates of clicked location

    const latitude =
        event.latlng.lat;

    const longitude =
        event.latlng.lng;


    // CREATE POPUP FORM

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



// LISTEN FOR THE "ADD PLACE" BUTTON

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


        // GET INFORMATION FROM THE FORM


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


        // GET COORDINATES


        const popup = map._popup;


        const latitude =
            popup.getLatLng().lat;


        const longitude =
            popup.getLatLng().lng;


        // CREATE FORM FOR GOOGLE APPS SCRIPT

        const form =
            document.createElement("form");


        form.method = "GET";

        form.action = SCRIPT_URL;

        form.target = "hiddenFrame";

        // FUNCTION FOR ADDING HIDDEN FIELDS

        function addField(name, value) {

            const input =
                document.createElement("input");


            input.type = "hidden";

            input.name = name;

            input.value = value;


            form.appendChild(input);

        }


        // ADD MEMORY INFORMATION


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

        // SEND THE FORM
    

        document.body.appendChild(form);

        form.submit();

        form.remove();

    
        // CLOSE THE FORM POPUP

        map.closePopup();




        L.popup()

            .setLatLng([
                latitude,
                longitude
            ])

            .setContent(

                "<h3>Memory saved 🌿</h3>" +

                "<p>" +

                "Your memory has been added." +

                "</p>" +

                "<p><em>" +

                "Refresh the page to see it on the map." +

                "</em></p>"

            )

            .openOn(map);

    }
);

// CREATE ROADTRIP

document.getElementById("roadtrip-button")
    .addEventListener("click", function () {

        // We need at least two locations to create a route.

        if (memories.length < 2) {

            alert(
                "You need at least two memories to create a roadtrip."
            );

            return;
        }

        // CREATE OSRM COORDINATE STRING

        // OSRM expects coordinates in this format:
        // longitude,latitude;longitude,latitude

        const coordinates = memories
            .map(memory =>
                memory.longitude +
                "," +
                memory.latitude
            )
            .join(";");


        // CREATE OSRM URL
 
        const routeURL =
            "https://router.project-osrm.org/route/v1/driving/" +
            coordinates +
            "?overview=full&geometries=geojson";


        // ASK OSRM FOR A ROUTE

        fetch(routeURL)

            .then(response => {

                if (!response.ok) {

                    throw new Error(
                        "OSRM request failed."
                    );

                }

                return response.json();

            })


            .then(data => {

                // Check that OSRM found a route

                if (
                    !data.routes ||
                    data.routes.length === 0
                ) {

                    throw new Error(
                        "No route was found."
                    );

                }


                // Get the first route

                const route =
                    data.routes[0];


                // REMOVE OLD ROUTE

                if (roadtripRoute) {

                    map.removeLayer(
                        roadtripRoute
                    );

                }


                // DRAW THE ROUTE

                roadtripRoute =
                    L.geoJSON(
                        route.geometry
                    ).addTo(map);

    
                // ZOOM TO THE ROUTE


                map.fitBounds(
                    roadtripRoute.getBounds()
                );


                // SHOW ROUTE INFORMATION


                const distance =
                    (route.distance / 1000)
                    .toFixed(1);


                const duration =
                    Math.round(
                        route.duration / 60
                    );


                L.popup()

                    .setLatLng(
                        roadtripRoute
                            .getBounds()
                            .getCenter()
                    )

                    .setContent(

                        "<h3>🚗 Roadtrip</h3>" +

                        "<p>" +

                        "<strong>Distance:</strong> " +
                        distance +
                        " km" +

                        "<br>" +

                        "<strong>Estimated driving time:</strong> " +
                        duration +
                        " min" +

                        "</p>"

                    )

                    .openOn(map);

            })


            // ERROR HANDLING
     
            .catch(error => {

                console.error(
                    "Could not create roadtrip:",
                    error
                );

                alert(
                    "Could not create the roadtrip."
                );

            });

    });
