/**
javascript file for all map related javascript code
**/

window.addEventListener("map:init", function (e) {
                var detail = e.originalEvent ?
                             e.originalEvent.detail : e.detail;
                var marker = {};
                detail.map.on('click', function(pos){
                    lat = pos.latlng.lat;
                    long = pos.latlng.lng;

                    console.log("You clicked the map at Lat: "+ lat+" and Long: "+long );
                    // delete existing marker
                    if(marker != undefined){
                        detail.map.removeLayer(marker);
                    };
                    // add a new marker
                    marker = L.marker([lat, long]).addTo(detail.map);
                });
            }, false);