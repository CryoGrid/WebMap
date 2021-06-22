
$(window).on('map:init', function (e) {
    var detail = e.originalEvent ?
                 e.originalEvent.detail : e.detail;

    var data = JSON.parse(JSON.parse(document.getElementById('grid_data').textContent));
    var cg = JSON.parse(document.getElementById('context').textContent);
    console.log('cg json data: ', cg);
    /**console.log('grid features: ', data.features, 'data type: ', typeof data.features, 'data length: ', data.features.length);

    var CanvasLayer = L.GridLayer.extend({
        for (var i = 0; i < data.features.length; i++){
            createTile: function(coords, done){

d
            }
        };
    })**/

    /**sql = 'SELECT * FROM cgmap_cryogriddata where grid = '**/
    var geojson;
    var boundArray = [];
    var polygonArray = [];

    var geoJsonArray = [];

    for (var i = 0; i < data.features.length; i++){
        /*var polygon = L.polygon([
            [data.features[i].properties.top, data.features[i].properties.left],
            [data.features[i].properties.top, data.features[i].properties.right],
            [data.features[i].properties.bottom, data.features[i].properties.right],
            [data.features[i].properties.bottom, data.features[i].properties.left]
        ]).addTo(detail.map);
        polygonArray.push(polygon);*/
        geoJsonArray.push({"type": "Feature", "properties": {"id": data.features[i].properties.id, "popupContent": " This is a Cell number: " + data.features[i].properties.id},
            "geometry": {"type": "Polygon", "coordinates": [
                [[data.features[i].properties.left, data.features[i].properties.top],
                [data.features[i].properties.right, data.features[i].properties.top],
                [data.features[i].properties.right, data.features[i].properties.bottom],
                [data.features[i].properties.left, data.features[i].properties.bottom]]
                ]}
            })
        /**var bounds = L.latLngBounds([data.features[i].properties.top, data.features[i].properties.left],
                                    [data.features[i].properties.bottom, data.features[i].properties.right]);
        polygon.on('click', function(){
            detail.map.fitBounds(this.getBounds())
        })
        boundArray.push(bounds);
        var lat = (data.features[i].properties.top - data.features[i].properties.bottom)/2 + data.features[i].properties.bottom;
        var long = (data.features[i].properties.right - data.features[i].properties.left)/2 + data.features[i].properties.left;
        var center = L.marker([lat, long]).addTo(detail.map);**/
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
    console.log('boundary array first entry: ', boundArray[0])
    console.log('first data entry: ', data.features[0]);
    var marker = {};
    var popup = L.popup();

    function whenClicked(e) {

        lat = e.latlng.lat;
        long = e.latlng.lng;
        console.log('target feature id ', e.target.feature.properties.id);
        content = "<h3 class=header3>This is cell number " +e.target.feature.properties.id+"</h3><div><hr>In the cell was clicked on map at Lat: "+ lat+" and Long: "+long  +" </div>";

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


    geojson = L.geoJSON(geoJsonArray, {
        style: style,
        onEachFeature: onEachFeature,
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, geojsonMarkerOptions)
        }
    }).addTo(detail.map);

});