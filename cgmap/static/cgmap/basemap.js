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
$(window).on('map:init', function (e) {
    var detail = e.originalEvent ?
                 e.originalEvent.detail : e.detail;

    var layerGroup = new L.layerGroup();
    var gridLayer;

    var data = JSON.parse(JSON.parse(document.getElementById('grid_data').textContent));
    var depth_level = JSON.parse(document.getElementById('context').textContent);
    var cg = JSON.parse(document.getElementById('cg_data').textContent);
    var fc = JSON.parse(document.getElementById('fc_data').textContent);
    //console.log('cg json data: ', cg, ' fc json data: ', fc, ' depth_level: ', depth_level);

    /**sql = 'SELECT * FROM cgmap_cryogriddata where grid = '**/
    var geojson;
    var boundArray = [];
    var polygonArray = [];

    var geoJsonArray = [];

    for (var i = 0; i < data.features.length; i++){
        geoJsonArray.push({"type": "Feature",
            "properties": {"id": data.features[i].properties.id,
                           "popupContent": " This is a Cell number: " + data.features[i].properties.id},
            "geometry": {"type": "Polygon", "coordinates": [
                [[data.features[i].properties.left, data.features[i].properties.top],
                [data.features[i].properties.right, data.features[i].properties.top],
                [data.features[i].properties.right, data.features[i].properties.bottom],
                [data.features[i].properties.left, data.features[i].properties.bottom]]
                ]}
            });
        if(fc[data.features[i].properties.id] != null){
            geoJsonArray[i].properties["soil_temp"] = cg[data.features[i].properties.id].soil_temp;
            geoJsonArray[i].properties["air_temp"] = fc[data.features[i].properties.id].air_temp;
            geoJsonArray[i].properties["date"] = cg[data.features[i].properties.id].date;
        };

    };

    function getColor(t) {
        return t > 30  ? '#EB5757' :
               t > 20  ? '#F2994A' :
               t > 10   ? '#F2C94C' :
               t > 0   ? '#6FCF97' :
               t > -10  ? '#E31A1C' :
               t > -20   ? '#9B51E0' :
                          '#FFEDA0';
    }

    function style(feature) {
        cellColor = '#FFEDA0';
        if(feature.properties.soil_temp != null){
            cellColor = getColor(feature.properties.soil_temp)
        }
        return {
            fillColor: cellColor,
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.4
        };
    }

    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.65
    };


    console.log('geojson first entry: ', geoJsonArray[0])
    //console.log('boundary array first entry: ', boundArray[0])
    console.log('first data entry: ', data.features[0]);
    var marker = {};
    var popup = L.popup();

    function whenClicked(e) {

        lat = e.latlng.lat;
        long = e.latlng.lng;
        console.log('target feature id ', e.target.feature.properties.id);
        content = "<h3 class=header3>Cell " +e.target.feature.properties.id+"</h3><div><hr>In the cell was clicked on map at Lat: "+ lat+" and Long: "+long  +" </div>";
        if(e.target.feature.properties.soil_temp != null){
        content +="<div>With a calculated soil temperature of: "+e.target.feature.properties.soil_temp+ "°C and air temperature of: "+ e.target.feature.properties.air_temp+"°C "+"</div>"
        content +="<div>For the date: "+e.target.feature.properties.date+"</div>"
        }

    // delete existing marker
        if(marker != undefined){
            detail.map.removeLayer(marker);
        };
        // add a new marker with a popup
        marker = L.marker([lat, long]).addTo(detail.map)
                    .bindPopup(content)
                    .openPopup();
        detail.map.fitBounds(e.target.getBounds());
    }

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: whenClicked,
        });
    }

    //mouseover event
    function highlightFeature(e) {
        var layer = e.target;

        layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    }

    //mouseout event
    function resetHighlight(e) {
        gridLayer.resetStyle(e.target);
    }

    //zooms to the cell
    function zoomToFeature(e) {
        detail.map.fitBounds(e.target.getBounds());
    }

    gridLayer = L.geoJSON(geoJsonArray, {
        style: style,
        onEachFeature: onEachFeature,
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, geojsonMarkerOptions)
        }
    }).addTo(layerGroup);



    layerControl = new L.Control.Layers(null, {
        'Grid Layer': gridLayer,
    }).addTo(detail.map);
});

let current_depth = 0 /** init depth is surface **/

/**var slider = document.getElementById("myRange");
slider.oninput = function() {
    console.log(slider.value)
}**/

$(document).ready(function(){
    var slider = document.getElementById("myRange");
    var depth_level;
    slider.onchange = function(event) {
        event.preventDefault();
        depth_level = slider.value
        depth_level  = Math.abs(depth_level)
        console.log(depth_level)
        $.ajax({
            url: 'get_depth_level_data/',
            type: 'POST',
            data: {url_data:depth_level},
            dataType: "json"
        })
        .done(function(response){
            console.log(response);
            console.log('has to be displayed on grid map: ', response[0], ' and depth level: ', response[1])
        })
        .fail(function(){
            console.log('Failed!')
        });
    }
});