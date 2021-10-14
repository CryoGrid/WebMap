/**
javascript file for the basemap related javascript code
**/

$(window).on('map:init', function (e) {
    var detail = e.originalEvent ?
                 e.originalEvent.detail : e.detail;

    var layerGroup = new L.layerGroup();
    var gridLayer;

    var geojson;
    var boundArray = [];
    var polygonArray = [];
    var geoJsonArray = [];

    /**
    parsing data from backend
    **/
    var data = JSON.parse(JSON.parse(document.getElementById('grid_data').textContent));
    var depth_level = JSON.parse(document.getElementById('context').textContent);
    var cg = JSON.parse(document.getElementById('cg_data').textContent);

    /**
    getting 2d context and creating charts via function call
    **/
    var ctx = document.getElementById('tempChart').getContext('2d');
    var ctx2 = document.getElementById('trumpetChart').getContext('2d');
    var ctx3 = document.getElementById('groundProfile').getContext('2d');
    createChart();
    createTrumpetChart();
    createGroundProfile();

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

    function getColor(t) {
        return t > 30  ? '#EB5757' :
               t > 25  ? '#F2994A' :
               t > 20  ? '#F2AF74' :
               t > 15  ? '#F2C94C' :
               t > 10  ? '#F2D374' :
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

    // grid cell click event: set marker and open popup window.
    function whenClicked(e) {

        lat = e.latlng.lat;
        long = e.latlng.lng;
        const content = `
            <h3 class=header3>Cell ${ e.target.feature.properties.id }
                <button type='button' onclick='open_graph();' class='btn btn-primary btn-sm graph-btn' style='position: absolute; right: 20px;' id='graph-btn'>
                    <span class='material-icons md-18 right' id='show_chart'>show_chart</span>
                </button>
            </h3>
            <div><hr>The cell was clicked at LatLong: ( ${lat.toFixed(2)} | ${long.toFixed(2)}  ), </div>
            <div>with a calculated soil temperature of: ${parseFloat(e.target.feature.properties.soil_temp).toFixed(2)}°C at a depth of ${parseFloat(e.target.feature.properties.depth_level).toFixed(2)} m.</div>
            <div>Assumed air temperature of:  ${parseFloat(e.target.feature.properties.air_temp).toFixed(2)}°C for the date: ${e.target.feature.properties.date}.</div>
            <div>For up-to-date temperatures visit the DWD website
                <a href='https://www.dwd.de/DE/wetter/wetterundklima_vorort/_node.html' target='_blank'>here</a>
                and for soil temperatures
                <a href='https://www.dwd.de/DE/leistungen/bodentemperatur/bodentemperatur.html' target='_blank'>here</a>.
            </div>

        `;

    // delete existing marker
        if(marker != undefined){
            detail.map.removeLayer(marker);
        };
        // add a new marker with a popup
        marker = L.marker([lat, long]).addTo(detail.map)
                    .bindPopup(content)
                    .openPopup();
        detail.map.fitBounds(e.target.getBounds());
        var cell_data = getCellData(e.target.feature.properties.depth_idx, e.target.feature.properties.id, e);
        var minMax = getMaxMin(e.target.feature.properties.id);
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
    }).addTo(layerGroup).addTo(detail.map);

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
            console.log('selected depth value: ', depth_level);
            $.ajax({
                url: 'get_depth_level_data/',
                type: 'POST',
                data: {url_data:depth_level},
                dataType: "json"
            })
            .done(function(response){
                $("#context").html(response[1].depth_level);
                for (var i = 0; i < geoJsonArray.length; i++){
                    id = geoJsonArray[i].properties["id"];
                    if(geoJsonArray[i].properties["soil_temp"] != null){
                        geoJsonArray[i].properties["depth_level"] = response[0].cg_data[id].depth_level;
                        geoJsonArray[i].properties["depth_idx"] = response[0].cg_data[id].depth_idx;
                        geoJsonArray[i].properties["soil_temp"] = response[0].cg_data[id].soil_temp;
                    }
                };
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
            query_data = response[0].cell_data;
            interval = response[2].date_interval;
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
            data = response[0]['depth_list'];
            interval = response[1]['date_interval'];
            updateProfileData(data, interval);
        })
        .fail(function(){
            console.log('Failed!')
        });
    };
/**
ajax function to get min, max and mean values for selected grid cell and updating corresponding chart
**/
    function getMaxMin(cell_id){
        $.ajax({
            url: 'get_max_min/',
            data: {idx:cell_id},
            type: 'POST',
        })
        .done(function(response){
            data = response[0]['depth_list'];
            updateData(data);
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
            datasets: [{
                label: 'Min',
                data: [],
                fill: false,
                borderColor: '#F2C94C',
                tension: 0.1
            },
            {
                label: 'Max',
                data: [],
                fill: false,
                borderColor: '#F2C94C',
                tension: 0.1
            },
            {
                label: 'Mean',
                data: [],
                fill: false,
                borderColor: '#693D00',
                tension: 0.1
            },
            {
                label: 'Median',
                data: [],
                fill: false,
                borderColor: '#BA700B',
                borderDash: [5, 5],
                tension: 0.1
            },
            {
                label: 'Max. Quantile',
                data: [],
                fill: false,
                borderColor: '#EB8702',
                borderDash: [5, 5],
                tension: 0.1
            },
            {
                label: 'Min. Quantile',
                data: [],
                fill: false,
                borderColor: '#EB8702',
                borderDash: [5, 5],
                tension: 0.1
            }],
        };
        trumpetChart = new Chart(ctx2, {
            type: 'line',
            data: data,
            options: {
                response: true,
                indexAxis: 'y',
                title: {
                    display: true,
                    text: 'Soil Temperature over the year 2020'
                },
                interaction: {
                    mode: 'index',
                    axis: 'y',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: (ctx) => 'Soil Temperature 2020'
                    },
                    legend: {
                        display: true,
                        position: 'right',
                        align: 'middle'
                    },
                },
                scales: {
                    x: {
                        display: true,
                        title:{
                            display: true,
                            text: 'Temperature'
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
                            text: 'Depth'
                        },
                        ticks: {
                            // For a category axis, the val is the index so the lookup via getLabelForValue is needed

                            callback: function(val, index) {
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
    function updateData(newData){
        min = [];
        max = [];
        mean = [];
        median = [];
        max_quantile = [];
        min_quantile = [];
        for (var i = 1; i < 16; i++){
            min.push(newData[i]['min']);
            max.push(newData[i]['max']);
            mean.push(newData[i]['mean']);
            median.push(newData[i]['median']);
            max_quantile.push(newData[i]['max_quantile']);
            min_quantile.push(newData[i]['min_quantile'])
        }
        trumpetChart.data.datasets[0].data = min;
        trumpetChart.data.datasets[1].data = max;
        trumpetChart.data.datasets[2].data = mean;
        trumpetChart.data.datasets[3].data = median;
        trumpetChart.data.datasets[4].data = max_quantile;
        trumpetChart.data.datasets[5].data = min_quantile;
        trumpetChart.update();
    }

    function getGradient(ctx, chartArea){
        let width, height, gradient = null;
        const chartWidth = chartArea.right - chartArea.left;
        const chartHeight = chartArea.bottom - chartArea.top;
        if(gradient === null || width !== chartWidth || height !== chartHeight){
            width = chartWidth;
            height = chartHeight;
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
    function for ground profile chart settings and options for drawing the chart
    **/
    function createGroundProfile(){

        const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const up = (ctx, value) => ctx.p0.options.backgroundColor != ctx.p1.options.backgroundColor ? value : undefined;
        const down = (ctx, value) => ctx.p0.options.backgroundColor == ctx.p1.options.backgroundColor ? value : undefined;
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
                    borderColor: ctx => up(ctx, ctx.p1.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p1.options.backgroundColor) || down(ctx, ctx.p0.options.backgroundColor),
                },
            },
            {
                label: '0.05 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;

                    if ( !chartArea ){
                        // This case happens on initial chart load
                        return null;
                    }
                    return getGradient(ctx, chartArea);
                }],
                borderColor: [],
                fill: '+1',
                segment: {
                    borderColor: ctx => up(ctx, ctx.p1.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p1.options.backgroundColor) || down(ctx, ctx.p0.options.backgroundColor),
                },
            },
            {
                label: '0.1 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;

                    if ( !chartArea ){
                        // This case happens on initial chart load
                        return null;
                    }
                    return getGradient(ctx, chartArea);
                }],
                borderColor: [],
                fill: '+1',
                segment: {
                    borderColor: ctx => up(ctx, ctx.p1.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p1.options.backgroundColor) || down(ctx, ctx.p0.options.backgroundColor),
                },
            },
            {
                label: '0.2 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;

                    if ( !chartArea ){
                        // This case happens on initial chart load
                        return null;
                    }
                    return getGradient(ctx, chartArea);
                }],
                borderColor: [],
                fill: '+1',
                segment: {
                    borderColor: ctx => up(ctx, ctx.p1.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p1.options.backgroundColor) || down(ctx, ctx.p0.options.backgroundColor),
                },
            },
            {
                label: '0.5 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;

                    if ( !chartArea ){
                        // This case happens on initial chart load
                        return null;
                    }
                    return getGradient(ctx, chartArea);
                }],
                borderColor: [],
                fill: '+1',
                segment: {
                    borderColor: ctx => up(ctx, ctx.p1.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p1.options.backgroundColor) || down(ctx, ctx.p0.options.backgroundColor),
                },
            },
            {
                label: '1 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;

                    if ( !chartArea ){
                        // This case happens on initial chart load
                        return null;
                    }
                    return getGradient(ctx, chartArea);
                }],
                borderColor: [],
                fill: '+1',
                segment: {
                    borderColor: ctx => up(ctx, ctx.p1.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p1.options.backgroundColor) || down(ctx, ctx.p0.options.backgroundColor),
                },
            },
            {
                label: '2 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;

                    if ( !chartArea ){
                        // This case happens on initial chart load
                        return null;
                    }
                    return getGradient(ctx, chartArea);
                }],
                borderColor: [],
                fill: '+1',
                segment: {
                    borderColor: ctx => up(ctx, ctx.p1.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p1.options.backgroundColor) || down(ctx, ctx.p0.options.backgroundColor),
                },
            },
            {
                label: '3 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;

                    if ( !chartArea ){
                        // This case happens on initial chart load
                        return null;
                    }
                    return getGradient(ctx, chartArea);
                }],
                borderColor: [],
                fill:'+1',
                segment: {
                    borderColor: ctx => up(ctx, ctx.p1.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p1.options.backgroundColor) || down(ctx, ctx.p0.options.backgroundColor),
                },
            },
            {
                label: '4 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;

                    if ( !chartArea ){
                        // This case happens on initial chart load
                        return null;
                    }
                    return getGradient(ctx, chartArea);
                }],
                borderColor: [],
                fill: '+1',
                segment: {
                    borderColor: ctx => up(ctx, ctx.p1.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p1.options.backgroundColor) || down(ctx, ctx.p0.options.backgroundColor),
                },
            },
            {
                label: '5 m',
                data: [],
                pointBackgroundColor: [],
                backgroundColor: [function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;

                    if ( !chartArea ){
                        // This case happens on initial chart load
                        return null;
                    }
                    return getGradient(ctx, chartArea);
                }],
                borderColor: [],
                fill: {value: 6},
                segment: {
                    borderColor: ctx => up(ctx, ctx.p1.options.borderColor) || down(ctx, ctx.p0.options.borderColor),
                    backgroundColor: ctx => up(ctx, ctx.p1.options.backgroundColor) || down(ctx, ctx.p0.options.backgroundColor),
                },
            }]
        };

        groundProfile = new Chart(ctx3, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: (ctx) => 'Ground Profile for 2020'
                    },
                    tooltip: {
                        mode: 'index',
                        callbacks: {
                            title: function(context){
                                for( var i = 0; i < context.length; i++){
                                    return context[i].label = 'Week ' + context[i].label;
                                }
                            },
                            label: function(context){
                                var label = context.dataset.label;
                                label += ' : ' + context.raw.r + '°';
                                return label;
                            }
                        },
                    },
                    legend: {
                        display: false,
                        position: 'top',
                        align: 'middle'
                    },
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
                            text: 'Weeks'
                        },
                    },
                    y: {
                        reverse: true,
                        title: {
                            display: true,
                            text: 'Depth'
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
    function addColor(data, trans){
    color = [];

        for( var i = 0; i < data.length; i++){
            if( data[i].r > 25){
                color.push('rgba(255,87,87,1)'); /* hex: #EB5757 - rgb: (235,87,87) */
                if( trans === true ){
                    color.push('rgba(255,87,87,0.4)'); /* hex: #EB5757 - rgb: (235,87,87) */
                }
            }
            else if( data[i].r > 20){
                color.push('rgba(242,153,74,1)'); /* hex: #F2994A - rgb: (242,153,74) */
                if( trans === true ){
                    color.push('rgba(242,153,74,0.4)'); /* hex: #F2994A - rgb: (242,153,74) */
                }
            }
            else if( data[i].r > 15){
                color.push('rgba(255,179,112,1)'); /* hex: #FFB370 - rgb: (255,179,112) */
                if( trans === true ){
                    color.push('rgba(255,179,112,0.4)'); /* hex: #FFB370 - rgb: (255,179,112) */
                }
            }
            else if( data[i].r > 10){
                color.push('rgba(242,201,76,1)'); /* hex: #F2C94C - rgb: (242,201,76) */
                if( trans === true ){
                    color.push('rgba(242,201,76,0.4)'); /* hex: #F2C94C - rgb: (242,201,76) */
                }
            }
            else if( data[i].r > 5){
                color.push('rgba(111,207,151,1)'); /* hex: #6FCF97 - rgb: (111,207,151) */
                if( trans === true ){
                    color.push('rgba(111,207,151,0.4)'); /* hex: #6FCF97 - rgb: (111,207,151) */
                }
            }
            else{
                color.push('rgba(45,156,219,1)'); /* hex: #2D9CDB - rgb: (45,156,219) */
                if( trans === true ){
                    color.push('rgba(45,156,219,0.4)'); /* hex: #2D9CDB - rgb: (45,156,219) */
                }
            }
        }
        return color
    }
/**
    update ground profile data and set colors for graph
**/
    function updateProfileData(data, interval){
        groundProfile.data.labels = [].concat.apply([], interval);
        for( var i = 0; i < 10; i++){
            groundProfile.data.datasets[i].data = data[i+1].data;
            var color = addColor(groundProfile.data.datasets[i].data, false);
            var trans = addColor(groundProfile.data.datasets[i].data, true);
            groundProfile.data.datasets[i].backgroundColor = trans;
            groundProfile.data.datasets[i].pointBackgroundColor = color;
            groundProfile.data.datasets[i].borderColor = color;
        }
        groundProfile.update();
    }
/**
    functions for temperature graph settings and options for drawing the chart
**/
    function createChart(){
        const labels = [];
        const data = {
            labels: labels,
            datasets: [{
                label: '50 cm',
                data: [0, 0.1],
                fill: false,
                borderColor: '#F2C94C',
                tension: 0.1
            },
            {
                label: '3 m',
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
                label: 'air temperature',
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
                        text: (ctx) => 'Ground temperature for 2020'
                    },
                    legend: {
                        display: true,
                        position: 'right',
                        align: 'middle'
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        display: true,
                        title:{
                            display: true,
                            text: 'Temperature'
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
        tempChart.data.datasets[2].label = e.target.feature.properties.depth_level + ' m';
        tempChart.data.datasets[3].data = q_data[0][3];
        tempChart.update();
    }
});
