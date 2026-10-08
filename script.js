const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyT7FmeWH4xVgPjtIYVFV50dnkdfPf71Zo5sgAPZ_IIzY6vc4DDPPiJhwnmmIlrIfDJ/exec";

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

    const title =
        document.getElementById("place-name").value;

    const comment =
        document.getElementById("place-comment").value;

    const author =
        document.getElementById("place-author").value;

    const popup = map._popup;

    const latitude =
        popup.getLatLng().lat;

    const longitude =
        popup.getLatLng().lng;


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

    alert("Memory added!");

    map.closePopup();

});
