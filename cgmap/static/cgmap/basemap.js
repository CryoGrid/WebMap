/**
javascript file for the basemap related javascript code
**/

$(window).on('map:init', function (e) {
    var detail = e.originalEvent ?
                 e.originalEvent.detail : e.detail;

    var layerGroup = new L.layerGroup();
    var gridLayer;
    var gridID;
    var prevSelectedLayer = null;

    var geojson;
    var boundArray = [];
    var polygonArray = [];
    var geoJsonArray = [];
    var activeYears = [];

    /**
    parsing data from backend
    **/
    var data = JSON.parse(JSON.parse(document.getElementById('grid_data').textContent));
    var depth_level = JSON.parse(document.getElementById('context').textContent);
    var cg = JSON.parse(document.getElementById('cg_data').textContent);
    // initiate values for dynamic temperature scale
    temperatureScale(cg);
    /**
    set dynamic temperature values for range slider and a gradient background
    **/

    function temperatureScale(cgData){
        let cg_arr = Object.values(cgData);
        let maxObj = Math.ceil(cg_arr.reduce((max, obj) => (Math.round(max.soil_temp) > Math.round(obj.soil_temp)) ? max : obj).soil_temp);
        let minObj = Math.floor(cg_arr.reduce((min, obj) => (Math.round(min.soil_temp) < Math.round(obj.soil_temp)) ? min : obj).soil_temp);
        let maxCol = getColor(maxObj, -10, 15);
        let minCol = getColor(minObj, -10, 15);
        // set values in ui element
        document.getElementById('temp_scale').min = minObj;
        document.getElementById('temp_scale').max = maxObj;
        document.getElementById('temp_scale').value = maxObj;
        document.getElementById('temp_scale').style = 'background: linear-gradient(0.25turn, '+minCol+','+maxCol+');';
    }
    /**
    button setup with related function for setting responding id
    **/
    const y2010 = document.getElementById('year1');
    const y2030 = document.getElementById('year3');
    const y2050 = document.getElementById('year5');
    const y2070 = document.getElementById('year7');
    const y2090 = document.getElementById('year9');
    y2010.addEventListener('click', function(){const id = 1; addYear(id, gridID)});
    y2030.addEventListener('click', function(){const id = 3; addYear(id, gridID)});
    y2050.addEventListener('click', function(){const id = 5; addYear(id, gridID)});
    y2070.addEventListener('click', function(){const id = 7; addYear(id, gridID)});
    y2090.addEventListener('click', function(){const id = 9; addYear(id, gridID)});

    /**
    getting 2d context and creating charts via function call
    **/
    const ctx = document.getElementById('tempChart').getContext('2d');
    const ctx2 = document.getElementById('trumpetChart').getContext('2d');
    const ctx3 = document.getElementById('groundProfile').getContext('2d');
    // declaring charts
    var tempChart;
    var trumpetChart;
    var groundProfile;
    // creating charts
    createChart();
    createTrumpetChart();
    createGroundProfile();
    // add datasets to trumpet chart
    function addYear(id, gridID){
        if(!activeYears.length){ // if array is empty -> add
            getMaxMin(gridID, id);
        }
        else if(!activeYears.includes(id)){ // if id is not set in array -> add
            getMaxMin(gridID, id);
        }
        else if(activeYears.includes(id)){ // if id is already in array -> remove and update chart
            let setSize = 6; // number of displayed data fields
            trumpetChart.data.datasets.splice(activeYears.indexOf(id)*setSize, setSize);
            activeYears.splice(activeYears.indexOf(id), 1);
            trumpetChart.update();
        }
    };

    $('#bs-tab2').on("shown.bs.tab", function() {
        createChart();
        $('#bs-tab2').off(); //to remove the bound event after initial rendering
    });
    $('#bs-tab2').on("shown.bs.tab", function() {
        createTrumpetChart();
        $('#bs-tab2').off(); //to remove the bound event after initial rendering
    });
    $('#bs-tab3').on("shown.bs.tab", function() {
        createGroundProfile();
        $('#bs-tab3').off(); //to remove the bound event after initial rendering
    });
    /**
    populating geojson array with db data
    **/
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
            geoJsonArray[i].properties["depth_level"] = cg[data.features[i].properties.id].depth_level;
            geoJsonArray[i].properties["depth_idx"] = cg[data.features[i].properties.id].depth_idx;
            geoJsonArray[i].properties["date"] = cg[data.features[i].properties.id].date;
        };
    };

    // hsl to hex converter
    function hsltohex(h, s, l){
         l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    // source: https://stackoverflow.com/questions/49482002/javascript-map-a-temperature-to-a-particular-hsl-hue-value
    function getHue(t, min, max){
        let maxHsl = 0; // maxHsl maps to max temp (here: 20deg past 360)
        let minHsl = 360; //  minhsl maps to min temp counter clockwise
        let rngHsl = maxHsl - minHsl; // = 210
        let maxTemp = max;
        let minTemp = min;
        let rngTemp = maxTemp - minTemp; // 60
        let degCnt = maxTemp - t; // 0
        let hslsDeg = rngHsl / rngTemp;  //210 / 125 = 1.68 Hsl-degs to Temp-degs
        let returnHue = (360 - ((degCnt * hslsDeg) - (maxHsl - 360)));
        return returnHue;
    }

    // color for grid cells
    function getColor(t, min, max) {
        const s = 100;
        const l = 50;
        const h = getHue(t, min, max);
        return hsltohex(h, s, l);
    }
    // style for grid cells
    function style(feature) {
        let cellColor = '#FFEDA0';
        if(feature.properties.soil_temp != null){
            cellColor = getColor(feature.properties.soil_temp, -10, 15)
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
    /**
        get open street map geo search provider
        Source: https://github.com/smeijer/leaflet-geosearch
    **/
    const search = new GeoSearch.GeoSearchControl({
        provider: new GeoSearch.OpenStreetMapProvider(),
        style: 'button',
        showMarker: false,
        marker: marker,
    });
    detail.map.addControl(search);
    // set marker and populate the content with db data
    detail.map.on('geosearch/showlocation', function(e) {
        if(popup){
            detail.map.removeLayer(popup);
        }
        var lat = Math.round((e.location.y + Number.EPSILON) * 100) / 100;
        var long = Math.round((e.location.x + Number.EPSILON) * 100) / 100;
        for (var i = 0; i < geoJsonArray.length; i++){
            var lat_min = geoJsonArray[i].geometry.coordinates[0][2][1];
            var lat_max = geoJsonArray[i].geometry.coordinates[0][0][1];
            var lng_min = geoJsonArray[i].geometry.coordinates[0][0][0];
            var lng_max = geoJsonArray[i].geometry.coordinates[0][1][0];
            if((lat >= lat_min && lat <= lat_max) && (long >= lng_min && long <= lng_max)){
                e.target["feature"] = {"properties": geoJsonArray[i].properties};
            }
        }
        createGridMarker(lat, long, e);
    });

    // grid cell click event: set marker and open popup window.
    function whenClicked(e) {
        var lat = e.latlng.lat;
        var long = e.latlng.lng;
        createGridMarker(lat, long, e);
        var div = document.getElementById('tab-nav');
        if (div.style.display === "none") {
            div.style.display = "flex";
        }
    }

    function setPopupContent(data, lat, long){
        // content for popup window -> includes the button for activating the charts
        let lbl = parseFloat(data.depth_level[0]);
        if (lbl < 1.0) {
            lbl = lbl/0.01 + ' cm';
        }
        else{
            lbl = lbl + ' m';
        }
        var content = `
            <h3 class=header3>Zelle ${ data.id }
                <button type='button' onclick='open_graph();' class='btn btn-primary btn-sm graph-btn' style='position: absolute; right: 20px;' id='graph-btn'>
                    <span class='material-icons md-18 right' id='show_chart'>show_chart</span>
                </button>
            </h3>
            <div><hr>Die Zelle wurde ausgewählt an den Koordinaten: ( ${lat.toFixed(2)} | ${long.toFixed(2)}  ), </div>
            <div>mit einer kalkulierten Bodentemperatur von: ${parseFloat(data.soil_temp).toFixed(1)}°C in einer Tiefe von ${lbl} .</div>
            <div>mit einer angenommenen Lufttemperatur:  ${parseFloat(data.air_temp).toFixed(1)}°C in Höhe von 2 m für den Zeitraum vom 1.1.2000 bis 31.12.2020.</div>
            <div>Aktuelle Temperaturen finden sie auf der DWD-Seite
                <a href='https://www.dwd.de/DE/wetter/wetterundklima_vorort/_node.html' target='_blank'>hier</a>
                und Bodentemperaturen
                <a href='https://www.dwd.de/DE/leistungen/bodentemperatur/bodentemperatur.html' target='_blank'>hier</a>.
            </div>

        `;

        return content;
    }

    // creates a grid marker for selected coordinates with db data
    function createGridMarker(lat, long, e){
        const content = setPopupContent(e.target.feature.properties, lat, long);

    // delete existing marker
        if(popup){
            detail.map.removeLayer(popup);
        };
        /** add a new marker with a popup
        marker = L.marker([lat, long]).addTo(detail.map)
                    .bindPopup(content)
                    .openPopup();**/
        popup
            .setLatLng(e.latlng)
            .setContent(content)
            .openOn(detail.map);
        // detail.map.fitBounds(e.target.getBounds());

        var cell_data = getCellData(e.target.feature.properties.depth_idx, e.target.feature.properties.id, e);
        trumpetChart.data.datasets.forEach((dataset) => {
            dataset.data.pop();
        });
        trumpetChart.data.datasets.splice(0, trumpetChart.data.datasets.length);
        activeYears.splice(0, activeYears.length);
        trumpetChart.update();
        var maxMin = getMaxMin(e.target.feature.properties.id, 1);
        var gP = getGroundProfile(e.target.feature.properties.id);
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

    //zooms to the cell -> not used
    function zoomToFeature(e) {
        detail.map.fitBounds(e.target.getBounds());
    }

    gridLayer = L.geoJSON(geoJsonArray, {
        style: style,
        onEachFeature: onEachFeature,
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, geojsonMarkerOptions)
        }
    }).addTo(layerGroup).addTo(detail.map);

    const layerControl = new L.Control.Layers(null, {
        'Grid Layer': gridLayer,
    }).addTo(detail.map);

/**
    jquery for dynamically updating the temperature data of the selected level for all grid cells
**/
    $(document).ready(function(){
        var slider = document.getElementById('depth_range');
        var depth_level;
        $('#depth_range').change(function(event) {
            event.preventDefault();
            depth_level = slider.value;
            depth_level  = Math.abs(depth_level);

            $.ajax({
                url: 'get_depth_level_data/',
                type: 'POST',
                data: {url_data:depth_level},
                dataType: 'json'
            })
            .done(function(response){
                $('#context').html(response[1].depth_level);
                for (var i = 0; i < geoJsonArray.length; i++){
                    var id = geoJsonArray[i].properties['id'];
                    if(geoJsonArray[i].properties['soil_temp'] != null){
                        geoJsonArray[i].properties['depth_level'] = response[0].cg_data[id].depth_level;
                        geoJsonArray[i].properties['depth_idx'] = response[0].cg_data[id].depth_idx;
                        geoJsonArray[i].properties['soil_temp'] = response[0].cg_data[id].soil_temp;
                    }
                };
                // remove old grid layer from map and layer control
                gridLayer.remove();
                layerControl.removeLayer(gridLayer);
                // draw grid layer and add to map as well as to the layer control
                gridLayer = L.geoJSON(geoJsonArray, {
                    style: style,
                    onEachFeature: onEachFeature,
                    pointToLayer: function (feature, latlng) {
                        return L.circleMarker(latlng, geojsonMarkerOptions)
                    }
                }).addTo(layerGroup).addTo(detail.map);
                layerControl.addOverlay(gridLayer, 'Grid Layer');
                // get new data for marker popup window
                // var id =  parseInt(marker.getPopup().getContent().split(/[\s]+/)[3]);
                var id =  parseInt(popup.getContent().split(/[\s]+/)[3]); // --> has to be changed for later updates, when id is not displayed anymore
                var obj = geoJsonArray.find(o => o.properties.id === id);
                var lat = popup.getLatLng().lat;
                var lng = popup.getLatLng().lng;
                /** set content of popup and update popup
                marker.getPopup().setContent(setPopupContent(obj.properties, lat, lng));
                marker.getPopup().update();**/
                popup.setContent(setPopupContent(obj.properties, lat, lng));
                popup.update();
                // update temperature scale after depth selection
                temperatureScale(response[0].cg_data);
            })
            .fail(function(){
                console.log('Failed!')
            });
        });
    });

/**
ajax function to get data for selected grid cell and updating corresponding chart
**/
    function getCellData(depth_level, cell_id, e){
        $.ajax({
            url: 'get_cell_data/',
            type: 'POST',
            data: {url_data:depth_level, idx:cell_id},
            dataType: "json"
        })
        .done(function(response){
            gridID = cell_id;

            var query_data = response[0].cell_data;
            var interval = response[2].date_interval;
            changeData(query_data, interval, e);
        })
        .fail(function(){
            console.log('Failed!')
        });
    };
/**
ajax function to get ground profile data for selected grid cell and updating corresponding chart
**/
    function getGroundProfile(cell_id){
        $.ajax({
            url: 'get_ground_profile/',
            data: {idx:cell_id},
            type: 'POST',
        })
        .done(function(response){
            var data = response[0]['depth_list'];
            var interval = response[1]['date_interval'];
            updateProfileData(data, interval);
        })
        .fail(function(){
            console.log('Failed!')
        });
    };
/**
ajax function to get min, max and mean values for selected grid cell and updating corresponding chart
**/
    function getMaxMin(cell_id, yearID){
        $.ajax({
            url: 'get_max_min/',
            data: {idx:cell_id, yID: yearID},
            type: 'POST',
        })
        .done(function(response){
            var data = response[0]['depth_list'];
            activeYears.push(yearID);
            updateData(data, yearID);
        })
        .fail(function(){
            console.log('Failed!')
        });
    };
/**
function for creating trumpet chart, contains config data for chart
**/
    function createTrumpetChart(){
        const labels = [0.01, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0 ];
        const data = {
            labels: labels,
            datasets: [],
        };
        trumpetChart = new Chart(ctx2, {
            type: 'line',
            data: data,
            options: {
                response: true,
                tension: 0.2,
                indexAxis: 'y',
                title: {
                    display: true,
                    text: 'Bodentemperatur über das Jahr 2020'
                },
                interaction: {
                    mode: 'index',
                    axis: 'y',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: (ctx) => 'Bodentemperaturprofiel zwischen 2000 und 2020'
                    },
                    legend: {
                        display: true,
                        position: 'right',
                        align: 'middle',
                        labels: {
                            boxHeight: 2,
                            filter: function(item, chart) {
                                return !item.text.includes('_');
                            }
                        },
                        onClick: function(e, legendItem) { // need to hide index +1
                            var index = legendItem.datasetIndex;
                            var ci = this.chart;
                            var alreadyHidden = (ci.getDatasetMeta(index).hidden === null) ? false : ci.getDatasetMeta(index).hidden;
                            var meta = ci.getDatasetMeta(index);
                            if ( index === 0 || index === 4) {
                                var meta_hi = ci.getDatasetMeta(index + 1);
                                if (!alreadyHidden) {
                                    meta.hidden = true;
                                    meta_hi.hidden = true;
                                } else {
                                    meta.hidden = null;
                                    meta_hi.hidden = null;
                                }
                            }
                            ci.update();
                        },
                    },
                    tooltip: {
                        mode: 'index',
                        callbacks: {
                            title: function(context){
                                for( var i = 0; i < context.length; i++){
                                    var lbl = context[i].label;
                                    if (lbl.includes('.')){
                                        lbl = parseFloat(lbl)/0.01;
                                        return context[i].label = ' in ' + lbl + ' cm';
                                    }
                                    return context[i].label = ' in ' + lbl + ' m';
                                }
                            },
                            label: function(context){
                                var label = context.dataset.label;
                                var data = context.dataset.data;
                                // update tooltip temperature data with lower and upper limits
                                if (context.raw.length == undefined){
                                    if (label.includes('Min/Max')){
                                        let nextData = trumpetChart.data.datasets[parseInt(context.datasetIndex) + 1].data;
                                        let newData = data.map(function(e, i){
                                            return [e, nextData[i]];
                                        });
                                        context.dataset.data = newData;
                                    }
                                    if (label.includes('1 0%/90%')){
                                        let nextData = trumpetChart.data.datasets[parseInt(context.datasetIndex) + 1].data;
                                        let newData = nextData.map(function(e, i){
                                            return [e, data[i]];
                                        });
                                        context.dataset.data = newData;
                                    }
                                    var val = Math.round(context.raw  * 10) / 10;
                                    label += ' : ' + val + '°';
                                } else {
                                    label += ' : ' + Math.round(context.raw[0]  * 10) / 10 + '°/'+ Math.round(context.raw[1]  * 10) / 10 + '°';
                                }
                                return label;
                            },
                        },
                        filter: function(context) {
                            var label = context.dataset.label;
                            var data = context.dataset.data;

                            return !label.includes('_');
                        }
                    },
                },
                scales: {
                    x: {
                        display: true,
                        title:{
                            display: true,
                            text: 'Temperatur'
                        },
                        ticks: {
                            // For a category axis, the val is the index so the lookup via getLabelForValue is needed
                            callback: function(val, index) {
                                return val + '°';
                            },
                        },
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Tiefe'
                        },
                        ticks: {
                            // For a category axis, the val is the index so the lookup via getLabelForValue is needed

                            callback: function(val, index) {
                                var lbl = this.getLabelForValue(index).toString();
                                    if (lbl.includes('.')){
                                        lbl = parseFloat(lbl)/0.01;
                                        return lbl + ' cm';
                                    }
                                return this.getLabelForValue(index) + ' m';
                            },
                        },
                    }
                }
            }
        });
    }

/**
function to update trumpet chart with requested data -> is called in ajax function
**/
    function updateData(newData, yearID){
        var min = [];
        var max = [];
        var mean = [];
        var median = [];
        var max_quantile = [];
        var min_quantile = [];
        var bgCol1;
        var bgCol2;
        var years = ['1990', '2000', '2010', '2020', '2030', '2040', '2050', '2060', '2070', '2080', '2090', '2100']

        for (var i = 1; i < 16; i++){
            min.push(newData[i]['min']);
            max.push(newData[i]['max']);
            mean.push(newData[i]['mean']);
            median.push(newData[i]['median']);
            max_quantile.push(newData[i]['max_quantile']);
            min_quantile.push(newData[i]['min_quantile'])
        }
        if ( yearID === 1){
            bgCol1 = 'rgba(45,156,219,0.1)';
            bgCol2 = 'rgba(45,156,219,0.2)';
        } else if ( yearID === 5) {
            bgCol1 = 'rgba(242,201,76,0.1)';
            bgCol2 = 'rgba(242,201,76,0.2)';
        } else if ( yearID === 7) {
            bgCol1 = 'rgba(242,153,74,0.1)';
            bgCol2 = 'rgba(242,153,74,0.2)';
        } else if ( yearID === 9) {
            bgCol1 = 'rgba(235,87,87,0.1)';
            bgCol2 = 'rgba(235,87,87,0.2)';
        } else if ( yearID === 3) {
            bgCol1 = 'rgba(111,207,151,0.1)';
            bgCol2 = 'rgba(111,207,151,0.2)';
        }
        trumpetChart.data.datasets.push({
                data: min,
                label: 'Min/Max ' +years[yearID] +'-'+ years[parseInt(yearID)+2],
                fill: '+1',
                backgroundColor: bgCol1,
                borderColor: '#F2C94C',
            },
            {
                data: max,
                label: '_Max_ ' +years[yearID] +'-'+ years[parseInt(yearID)+2],
                fill: false,
                borderColor: '#F2C94C',
            },
            {
                data: mean,
                label: 'Mean ' +years[yearID] +'-'+ years[parseInt(yearID)+2],
                fill: false,
                borderColor: '#693D00',
            },
            {
                data: median,
                label: 'Median ' +years[yearID] +'-'+ years[parseInt(yearID)+2],
                fill: false,
                borderColor: '#BA700B',
                borderDash: [5, 5],
            },
            {
                data: max_quantile,
                label: 'Quantile 10%/90%',
                fill: false,
                fill: '+1',
                backgroundColor: bgCol2,
                borderColor: '#EB8702',
                borderDash: [5, 5],
            },
            {
                data: min_quantile,
                label: '_Quantile_ ' +years[yearID] +'-'+ years[parseInt(yearID)+2],
                fill: false,
                borderColor: '#EB8702',
                borderDash: [5, 5],
            });

        trumpetChart.update();
    }
    /**
    function for creating a color gradient
    **/
    function getGradient(ctx, chartArea){
        var width, height, gradient = null;
        const chartWidth = chartArea.right - chartArea.left;
        const chartHeight = chartArea.bottom - chartArea.top;
        if(gradient === null || width !== chartWidth || height !== chartHeight){
            var width = chartWidth;
            var height = chartHeight;
            gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, '#2D9CDB');
            gradient.addColorStop(0.25, '#6FCF97');
            gradient.addColorStop(0.5, '#F2C94C');
            gradient.addColorStop(0.75, '#F2994A');
            gradient.addColorStop(1, '#EB5757');
        }
        return gradient;
    }

    /**
    calculate line gradient for the depth time chart with respect to each point -> not working right now
    **/
    function getLineGradient(startPoint, origin, idx){
        var gradient = null;
        //let y_label = startPoint.y + ' m';
        //let legend_id = groundProfile.legend.legendItems
        let y_id = idx + 2;
        let x_id = parseInt(startPoint.x) - 1;

        if( y_id > 10){
            y_id = 1;
        }

        let coords = origin[y_id].data[x_id];
        gradient = ctx3.createLinearGradient(startPoint.x, startPoint.y, coords.x, coords.y);
        gradient.addColorStop(0, getColor(startPoint.r, -15, 20));
        gradient.addColorStop(1, getColor(coords.r, -15, 20));

        /**ctx3.strokeStyle = gradient;
        let w = coords.x - startPoint.x;
        let h = coords.y - startPoint.y;
        console.log('rect coords: x', startPoint.x, 'y', startPoint.y, 'w', w, 'h', h);
        ctx3.fillRect(startPoint.x, startPoint.y, w, h);**/

        return gradient;
    }

    /**
    function for ground profile chart settings and options for drawing the chart
    **/
    function createGroundProfile(){

        const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        /* const up checks if the next point has a different color as the current -> in datasets the color will be changed accordingly */
        const up = (ctx, value) => ctx.p0.options.borderColor != ctx.p1.options.borderColor ? value : undefined;
        const down = (ctx, value) => ctx.p0.options.borderColor == ctx.p1.options.borderColor ? value : undefined;

        const data = {
            labels: labels,
            datasets: [
            {
                label: '0.01 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [],
                borderColor: [],
                fill: '+1',
                segment: {
                    backgroundColor: ctx => up(ctx, ctx.p0.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    borderColor: ctx => up(ctx, ctx.p0.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                },
            },
            {
                label: '0.05 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [],
                borderColor: [],
                fill: '+1',
                segment: {
                    borderColor: ctx => up(ctx, ctx.p0.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p0.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                },
            },
            {
                label: '0.1 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [],
                borderColor: [],
                fill: '+1',
                segment: {
                    borderColor: ctx => up(ctx, ctx.p0.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p0.options.backgroundColor) || down(ctx, ctx.p0.options.backgroundColor),
                },
            },
            {
                label: '0.2 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [],
                borderColor: [],
                fill: '+1',
                segment: {
                    borderColor: ctx => up(ctx, ctx.p0.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p0.options.backgroundColor) || down(ctx, ctx.p0.options.backgroundColor),
                },
            },
            {
                label: '0.5 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [],
                borderColor: [],
                fill: '+1',
                segment: {
                    borderColor: ctx => up(ctx, ctx.p0.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p0.options.backgroundColor) || down(ctx, ctx.p0.options.backgroundColor),
                },
            },
            {
                label: '1 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [],
                borderColor: [],
                fill: '+1',
                segment: {
                    borderColor: ctx => up(ctx, ctx.p0.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p0.options.backgroundColor) || down(ctx, ctx.p0.options.backgroundColor),
                },
            },
            {
                label: '2 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [],
                borderColor: [],
                fill: '+1',
                segment: {
                    borderColor: ctx => up(ctx, ctx.p0.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p0.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                },
            },
            {
                label: '3 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [],
                borderColor: [],
                fill:'+1',
                segment: {
                    borderColor: ctx => up(ctx, ctx.p0.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p0.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                },
            },
            {
                label: '4 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [],
                borderColor: [],
                fill: '+1',
                segment: {
                    borderColor: ctx => up(ctx, ctx.p0.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p0.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                },/**
                segment: {
                    borderColor: ctx => up(ctx, function(context) {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if ( !chartArea ){
                            // This case happens on initial chart load
                            return null;
                        }
                        return getLineGradient(ctx, ctx.p0, ctx.p1);
                    }) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, function(context) {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        console.log('chart of 4m level: ', chart);
                        if ( !chartArea ){
                            // This case happens on initial chart load
                            return null;
                        }
                        return getLineGradient(ctx, ctx.p0, ctx.p1);
                    }) || down(ctx, ctx.p0.options.backgroundColor),
                },**/
            },
            {
                label: '5 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [],
                borderColor: [],
                fill: {value: 6},
                segment: {
                    borderColor: ctx => up(ctx, ctx.p0.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p0.options.borderColor) || down(ctx, ctx.p0.options.backgroundColor),
                },
            }]
        };

        groundProfile = new Chart(ctx3, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                indexAxis: 'x',
                plugins: {
                    title: {
                        display: true,
                        text: (ctx) => 'Tiefen-Zeit Diagramm für 2020'
                    },
                    tooltip: {
                        mode: 'x',
                        callbacks: {
                            title: function(context){
                                for( var i = 0; i < context.length; i++){
                                    return context[i].label = 'Woche ' + context[i].label;
                                }
                            },
                            label: function(context){
                                var label = context.dataset.label;
                                var val = Math.round(context.raw.r  * 10) / 10;
                                label += ' : ' + val + '°';
                                return label;
                            },
                        },
                    },
                    legend: {
                        display: false,
                        position: 'right',
                        align: 'middle'
                    },
                    /*afterLayout: chart => {
                        var ctx = chart.chart.ctx;
                        var yAxis = chart.scales['y-axis-0'];
                        var gradientStroke = ctx.createLinearGradient(0, yAxis.top, 0, yAxis.bottom);
                        var dataset = chart.data.datasets[0];
                        console.log('dataset: ', dataset);
                        dataset.borderColor.forEach((c,i) => {
                            var stop = 1/(dataset.borderColor.length - 1) * i;
                            gradientStroke.addColorStop(stop, dataset.borderColor[i]);
                        });
                        dataset.borderColor = gradientStroke;
                        dataset.pointBorderColor = gradientStroke;
                        dataset.pointBackgroundColor = gradientStroke;
                        dataset.pointHoverBorderColor = gradientStroke;
                        dataset.pointHoverBackgroundColor = gradientStroke;
                    },*/
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Wochen'
                        },
                    },
                    y: {
                        reverse: true,
                        title: {
                            display: true,
                            text: 'Tiefe'
                        },
                        ticks: {
                            // For a category axis, the val is the index so the lookup via getLabelForValue is needed
                            callback: function(val, index) {
                                return val + ' m';
                            },
                        },
                    }
                },
                elements: {
                    point: {
                        radius: 0
                    },
                },
            }
        });
    }
    /* gets the size of an object*/
    Object.size = function(obj) {
        var size = 0,
        key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    /*function convertToTuple(data, interval){
        var size = Object.size(data);
        for( var i = 1; i <= size; i++){
            temp = [];
            for( var j = 0; j < data[i].x.length; j++){
            temp.push({'x':interval[j][0], 'y': data[i].y, 'r':data[i].x[j]});
            }
            data[i] = temp;
        }
        return data;
    }*/
/**
    depending on temperature set color
**/
    function addColor(data, origin, idx){
        var color = [];

        for( var i = 0; i < data.length; i++){
            let col = getLineGradient(data[i], origin, idx);
            //color.push(col);
            color.push(getColor(data[i].r, -15, 20));
        }
        return color
    }

/**
    update ground profile data and set colors for graph
**/
    function updateProfileData(data, interval){
        groundProfile.data.labels = [].concat.apply([], interval);
        let flat_arr = [];

        for( var i = 0; i < 10; i++){
            groundProfile.data.datasets[i].data = data[i+1].data;
            let color = addColor(groundProfile.data.datasets[i].data, data, i);
            groundProfile.data.datasets[i].pointBackgroundColor = color;
            groundProfile.data.datasets[i].borderColor = color;
            groundProfile.data.datasets[i].backgroundColor = color;
            flat_arr.push(data[i+1].data);
        }

        //console.log('ground profile data: ', groundProfile.data);

        groundProfile.update();
        /** set background color of range slider to a gradient **/
        let cg_arr = [].concat.apply([], flat_arr);
        let maxObj = Math.ceil(cg_arr.reduce((max, obj) => (Math.round(max.r) > Math.round(obj.r)) ? max : obj).r);
        let minObj = Math.floor(cg_arr.reduce((min, obj) => (Math.round(min.r) < Math.round(obj.r)) ? min : obj).r);

        //console.log('min: ', minObj, ' max: ', maxObj, ' mean: ', ((maxObj+minObj)/3));
        /** calculate color for range slider **/
        let maxCol = getColor(25, -15, 20);
        let meanCol1 = getColor(20, -15, 20);
        let meanCol2 = getColor(15, -15, 20);
        let meanCol3 = getColor(10, -15, 20);
        let meanCol4 = getColor(5, -15, 20);
        let minCol = getColor(-0.1, -15, 20);
        /** set values for range slider**/
        document.getElementById('depth_temp_scale').min = minObj;
        document.getElementById('depth_temp_scale').max = maxObj;
        document.getElementById('depth_temp_scale').value = minObj;
        document.getElementById('depth_temp_scale').style = 'background: linear-gradient(0.25turn, '+minCol+','+meanCol4+','+meanCol2+','+meanCol1+','+maxCol+');';
    }

/**
    functions for temperature graph settings and options for drawing the chart
**/
    function createChart(){
        const labels = [];
        const data = {
            labels: labels,
            datasets: [{
                label: '1 m',
                data: [0, 0.1],
                fill: false,
                borderColor: '#F2C94C',
                tension: 0.1
            },
            {
                label: '2 m',
                data: [0, 0.1],
                fill: false,
                borderColor: '#BA700B',
                tension: 0.1
            },
            {
                label: 'depth in m',
                data: [0, 0.1],
                fill: false,
                borderColor: '#EB8702',
                tension: 0.1
            },
            {
                label: '2 m Lufttemperatur',
                data: [0, 0.1],
                fill: false,
                borderColor: '#2D9CDB',
                tension: 0.1
            }],
        };
        tempChart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    axis: 'x',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: (ctx) => 'Bodentemperatur für 2020'
                    },
                    legend: {
                        display: true,
                        position: 'right',
                        align: 'middle'
                    },
                    tooltip: {
                        mode: 'index',
                        callbacks: {
                            label: function(context){
                                var label = context.dataset.label;
                                var val = Math.round(context.raw  * 10) / 10;
                                label += ' : ' + val + '°';
                                return label;
                            }
                        },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        display: true,
                        title:{
                            display: true,
                            text: 'Temperatur'
                        },
                        ticks: {
                            // For a category axis, the val is the index so the lookup via getLabelForValue is needed
                            callback: function(val, index) {
                                // Hide the label of every 2nd dataset
                                return val + '°';
                            },
                        },
                    }
                }
            }
        });
    };
/**
    change data of temperature graph -> will be updated when new depth is selected
**/
    function changeData(q_data, interval, e){
        tempChart.data.labels = [].concat.apply([], interval);
        tempChart.data.datasets[0].data = q_data[0][1];
        tempChart.data.datasets[1].data = q_data[0][2];
        tempChart.data.datasets[2].data = q_data[0][0];
        var lbl = parseFloat(e.target.feature.properties.depth_level[0]);
        if (lbl < 1.0) {
            lbl = lbl/0.01 + ' cm';
        }
        else{
            lbl = lbl + ' m';
        }
        tempChart.data.datasets[2].label = lbl;
        tempChart.data.datasets[3].data = q_data[0][3];
        tempChart.update();
    }
});
