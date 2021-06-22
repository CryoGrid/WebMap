/**
javascript file for the basemap related javascript code
**/

/**window.addEventListener("map:init", function (e) {
        var detail = e.originalEvent ?
                     e.originalEvent.detail : e.detail;
        var data = JSON.parse(JSON.parse(document.getElementById('fd_data').textContent));
        console.log('cg json data: ', data)
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
    }, false);**/


console.log('hello world')

let current_depth = 0 /** init depth is surface **/

$.ajax({
    type: 'GET',
    url: '/cgmap/', /** url: `/cgmap/${depth}`,**/
    success: function(grid_data){
        console.log('grid_data')
    },
    error: function(error){
        console.log(error)
    },
})