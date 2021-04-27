/**
javascript file for all map related javascript code
**/

window.addEventListener("map:init", function (e) {
        var detail = e.originalEvent ?
                     e.originalEvent.detail : e.detail;
        var marker = {};
        var popup = L.popup();
        detail.map.on('click', function(pos){
            lat = pos.latlng.lat;
            long = pos.latlng.lng;

            content = "<h3 class=header3>This is a header</h3><div><hr> You clicked the map at Lat: "+ lat+" and Long: "+long +"</div>"

            console.log( "You clicked the map at Lat: "+ lat+" and Long: "+long );
            // delete existing marker
            if(marker != undefined){
                detail.map.removeLayer(marker);
            };
            // add a new marker with a popup
            marker = L.marker([lat, long]).addTo(detail.map)
                        .bindPopup(content)
                        .openPopup();
        });
    }, false);