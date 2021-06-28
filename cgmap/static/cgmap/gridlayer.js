
$(window).on('map:init', function (e) {
    var detail = e.originalEvent ?
                 e.originalEvent.detail : e.detail;

    var data = JSON.parse(JSON.parse(document.getElementById('grid_data').textContent));
    var depth_level = JSON.parse(document.getElementById('context').textContent);
    var cg = JSON.parse(document.getElementById('cg_data').textContent);
    var fc = JSON.parse(document.getElementById('fc_data').textContent);
    console.log('cg json data: ', cg, ' fc json data: ', fc, ' depth_level: ', depth_level);

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
        if(data.features[i].properties.id == cg.grid_id){
            geoJsonArray[i].properties["soil_temp"] = cg.soil_temp;
            geoJsonArray[i].properties["air_temp"] = fc.air_temp;
            geoJsonArray[i].properties["date"] = cg.date;
        };

    };

    function style(feature) {
        return {
            fillColor: '#ff7800',
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
        geojson.resetStyle(e.target);
    }

    //zooms to the cell
    function zoomToFeature(e) {
        detail.map.fitBounds(e.target.getBounds());
    }

    function create_grid_layer(){
        geojson = L.geoJSON(geoJsonArray, {
            style: style,
            onEachFeature: onEachFeature,
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, geojsonMarkerOptions)
            }
        });
    }

});