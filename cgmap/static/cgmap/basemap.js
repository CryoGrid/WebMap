/**
javascript file for the basemap related javascript code
**/

$(window).on('map:init', function (e) {
    var detail = e.originalEvent ?
                 e.originalEvent.detail : e.detail;

    var layerGroup = new L.layerGroup();
    var gridLayer;

    var data = JSON.parse(JSON.parse(document.getElementById('grid_data').textContent));
    var depth_level = JSON.parse(document.getElementById('context').textContent);
    var cg = JSON.parse(document.getElementById('cg_data').textContent);
    /**var fc = JSON.parse(document.getElementById('fc_data').textContent);**/

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
        if(cg[data.features[i].properties.id] != null){
            geoJsonArray[i].properties["soil_temp"] = cg[data.features[i].properties.id].soil_temp;
            geoJsonArray[i].properties["air_temp"] = cg[data.features[i].properties.id].air_temp;
            geoJsonArray[i].properties["date"] = cg[data.features[i].properties.id].date;
        };

    };
    console.log('geo json array: ', geoJsonArray)

    function getColor(t) {
        return t > 30  ? '#EB5757' :
               t > 25  ? '#F2AF74' :
               t > 20  ? '#F2994A' :
               t > 15  ? '#F2D374' :
               t > 10  ? '#F2C94C' :
               t > 5   ? '#86CFA4' :
               t > 0   ? '#6FCF97' :
               t > -5  ? '#5AACDB' :
               t > -10 ? '#2D9CDB' :
               t > -15 ? '#AC75E0' :
               t > -20 ? '#9B51E0' :
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

    var marker = {};
    var popup = L.popup();

    function whenClicked(e) {
        lat = e.latlng.lat;
        long = e.latlng.lng;
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

/**
    jquery for dynamically updating the temperature data of the selected level for all grid cells
**/
    $(document).ready(function(){
        var slider = document.getElementById("myRange");
        var depth_level;
        $('#myRange').change(function(event) {
            event.preventDefault();
            depth_level = slider.value;
            depth_level  = Math.abs(depth_level);
            $.ajax({
                url: 'get_depth_level_data/',
                type: 'POST',
                data: {url_data:depth_level},
                dataType: "json"
            })
            .done(function(response){
                console.log('data: '+ response[0].cg_data[1415].soil_temp + ' at depth_leve: ' + response[1].depth_level);
                $("#context").html(response[1].depth_level);
                /*TODO: replace hard coded id with a flexible one*/
                for (var i = 0; i < geoJsonArray.length; i++){
                    id = geoJsonArray[i].properties["id"];
                    if(geoJsonArray[i].properties["soil_temp"] != null){
                        console.log('geo json id ', i, ' soil propertie: ', geoJsonArray[i].properties["soil_temp"], ' grid_id: ', id, ' and soil temp: ', response[0].cg_data[id].soil_temp);
                        geoJsonArray[i].properties["soil_temp"] = response[0].cg_data[id].soil_temp;
                    }
                };
            })
            .fail(function(){
                console.log('Failed!')
            });
        });
    });
});
