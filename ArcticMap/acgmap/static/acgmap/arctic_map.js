// Your access token can be found at: https://cesium.com/ion/tokens.
// This is the default access token from your ion account
/**import * as Cesium from '/static/Cesium';
import "/static/Cesium/Build/Cesium/Widgets/widgets.css";
**/

const BingMapsApi = 'AvgY2m7VyKZj6P0MLanxAsLwy6gN4OdbJWKoXkIRQSbcPWRMa0wtHc3pVFFHA1to';

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.

const viewer = new Cesium.Viewer('cesiumContainer', {
    imageryProvider: new Cesium.BingMapsImageryProvider({
        url : 'https://dev.virtualearth.net',
        key : BingMapsApi ,
        mapStyle : Cesium.BingMapsStyle.AERIAL_WITH_LABELS
    }),
    requestRenderMode: true,
    maximumRenderTimeChange: Infinity,
    timeline: false,
    animation: false,
    baseLayerPicker: false,
    sceneModePicker: false,
});
// setup cesium skybox
viewer.skyBox = new Cesium.SkyBox({
    sources : {
        positiveX : positiveX,
        negativeX : negativeX,
        positiveY : positiveY,
        negativeY : negativeY,
        positiveZ : positiveZ,
        negativeZ : negativeZ
    }
});
var iframe = document.getElementsByClassName('cesium-infoBox-iframe')[0];
iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms');
/**
parsing data from backend
**/
var data = JSON.parse(JSON.parse(document.getElementById('grid_data').textContent));
var cg = JSON.parse(document.getElementById('cg_data').textContent);
var depth_list = JSON.parse(document.getElementById('depth_levels').textContent);
var geoJsonArray = [];
/**
populating geojson array with db data
**/
for (var i = 0; i < data.features.length; i++){
    if (data.features[i].properties.left < 0.0){
        var left = 181.0 + data.features[i].properties.left*(-1.0);
        var right = 181.0 + data.features[i].properties.right*(-1.0);
        data.features[i].properties.left = left;
        data.features[i].properties.right = right;
    }

    geoJsonArray.push({"type": "Feature",
        "properties": {"id": data.features[i].properties.id,
                       "name": cg[data.features[i].properties.id].file_name,
                       "popupContent": " This is a Cell number: " + data.features[i].properties.id},
        "geometry": {"type": "Polygon", "coordinates": [
            [[data.features[i].properties.left, data.features[i].properties.top],
            [data.features[i].properties.right, data.features[i].properties.top],
            [data.features[i].properties.right, data.features[i].properties.bottom],
            [data.features[i].properties.left, data.features[i].properties.bottom]]
            ]}
        });
        if(cg[data.features[i].properties.id] != null){
            geoJsonArray[i].properties["av_preindustrial_51"] = cg[data.features[i].properties.id].av_preindustrial_51;
            geoJsonArray[i].properties["max_preindustrial_51"] = cg[data.features[i].properties.id].max_preindustrial_51;
            geoJsonArray[i].properties["min_preindustrial_51"] = cg[data.features[i].properties.id].min_preindustrial_51;
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
// hsl to rgb converter -> https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
function hexToRgbA(hex){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',0.5)';
    }
    return hex;
}

// source: https://stackoverflow.com/questions/49482002/javascript-map-a-temperature-to-a-particular-hsl-hue-value
function getHue(t, min, max, hslMax, hslMin){
    let maxHsl = hslMax; // maxHsl maps to max temp (here: 20deg past 360)
    let minHsl = hslMin; //  minhsl maps to min temp counter clockwise
    let rngHsl = maxHsl - minHsl; // = 210
    let maxTemp = max;
    let minTemp = min;
    let rngTemp = maxTemp - minTemp; // 60
    let degCnt = maxTemp - t; // 0
    let hslsDeg = rngHsl / rngTemp;  //210 / 125 = 1.68 Hsl-degs to Temp-degs
    let returnHue = (360 - ((degCnt * hslsDeg) - (maxHsl - 360)));
    return returnHue;
}
// get hex color for to different intervals -> ],0] and [0,[
function getHexCol(t){
    const s = 100;
    const l = 50;
    var h = 0;
    if( t > 0.0){
        // color between yellow and red
        var min = 1;
        var max = 10;
        var hslMax = 340;
        var hslMin = 440;
        h = getHue(t, min, max, hslMax, hslMin);
    }
    else if( t <= 0.0){
        // color between white and blue/purple
        var min = -30;
        var max = 0;
        var hslMax = 180;
        var hslMin = 270;
        h = getHue(t, min, max, hslMax, hslMin);
    }
    return hsltohex(h, s, l);
}

// color for grid cells
function getColor(t, min, max) {
    const s = 100;
    const l = 50;
    const h = getHue(t, min, max);
    return hsltohex(h, s, l);
}
// create a cesium entity
function createEntity(data, mat_col, line_col){
    return new Cesium.Entity({
        id: data.properties.id,
        name: data.properties.name,
        average_preindustrial: data.properties.av_preindustrial_51,
        min_preindustrial: data.properties.min_preindustrial_51,
        max_preindustrial: data.properties.max_preindustrial_51,
        polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray([
                data.geometry.coordinates[0][0][0], data.geometry.coordinates[0][0][1],
                data.geometry.coordinates[0][1][0], data.geometry.coordinates[0][1][1],
                data.geometry.coordinates[0][2][0], data.geometry.coordinates[0][2][1],
                data.geometry.coordinates[0][3][0], data.geometry.coordinates[0][3][1]
            ]),
            height: 0,
            material: Cesium.Color.fromCssColorString(mat_col),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString(line_col),
            outlineWidth: 5
        },
        entityCollection: 'GeoJsonData',
    });
}

/** create features**/
var customDataSource = new Cesium.CustomDataSource('GeoJsonData');
for(var v = 0; v < geoJsonArray.length; v++){
    let hex_col = getHexCol(geoJsonArray[v].properties["av_preindustrial_51"]);
    let rgba_col = hexToRgbA(hex_col);
    var entity = createEntity(geoJsonArray[v], rgba_col, hex_col);
    entity.addProperty('name');
    entity.name = geoJsonArray[v].properties.name;
    customDataSource.entities.add(entity);
}
viewer.dataSources.add(customDataSource)

// event listener for cesium entity
viewer.selectedEntityChanged.addEventListener(
    function(selectedEntity){
        if(Cesium.defined(selectedEntity)){
            if(Cesium.defined(selectedEntity.id)){
                let cell_id = selectedEntity.id;
                 // remove existing data
                trumpetChart.data.datasets.forEach((dataset) => {
                    dataset.data.pop();
                });
                trumpetChart.data.datasets.splice(0, trumpetChart.data.datasets.length);
                trumpetChart.update();
                // get new data
                getCellData(cell_id);

                selectedEntity.description =`
                    <table class="cesium-infoBox-defaultTable"><tbody>
                    <tr><th>ID</th><td>
                        ${selectedEntity.id}
                    </td></tr>
                    <tr><th>Name</th><td>
                        ${selectedEntity.name}
                    </td></tr>
                    </tbody></table>
                    `;
                var div = document.getElementById('chart-overlay');
                div.style.display = "flex";

            } else {
                console.log('Unknown entity selected.');
            }
        } else {
            var div = document.getElementById('chart-overlay');
            div.style.display = "none";
            console.log('Deselected.');
        }
    });

/**
ajax function to get data for selected grid cell and updating corresponding chart
**/
    function getCellData(cell_id){
        $.ajax({
            url: 'get_cell_data/',
            type: 'POST',
            data: {idx:cell_id},
            dataType: "json"
        })
        .done(function(response){
            // if request is successful update data in changeData function
            let gridID = cell_id;

            var query_data = response[0].cg_data;
            updateData(cell_id, query_data.data);
        })
        .fail(function(){
            console.log('Failed!')
        });
    };

/**
getting 2d context and creating charts via function call
**/
const ctx = document.getElementById('trumpetChart').getContext('2d');

// declaring charts
var trumpetChart;
// creating charts
createTrumpetChart();
/**
function for creating trumpet chart, contains config data for chart
**/
    function createTrumpetChart(){
        const labels = Object.values(depth_list);
        const data = {
            labels: labels,
            datasets: [],
        };
        trumpetChart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                response: true,
                tension: 0.2,
                indexAxis: 'y',
                title: {
                    display: true,
                    text: 'Trumpet Curve'
                },
                interaction: {
                    mode: 'index',
                    axis: 'y',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: (ctx) => 'Trumpet Curve'
                    },
                    legend: {
                        display: true,
                        position: 'bottom',
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
                                    /**if (lbl.includes('.')){
                                        lbl = parseFloat(lbl)/0.01;
                                        return context[i].label = ' in ' + lbl + ' cm';
                                    }**/
                                    return context[i].label = ' in ' + lbl + ' m';
                                }
                            },
                            label: function(context){
                                var label = context.dataset.label;
                                var data = context.dataset.data;
                                // update tooltip temperature data with lower and upper limits
                                if (label.includes('Min/Max')){
                                    let max = trumpetChart.data.datasets[parseInt(context.datasetIndex) + 1].data[parseInt(context.dataIndex)];
                                    label += ' : ' + Math.round(context.raw * 10) / 10 + '°/'+ Math.round(max * 10) / 10 + '°';
                                }
                                /**else if (label.includes('10%/90%')){
                                    let min = trumpetChart.data.datasets[parseInt(context.datasetIndex) + 1].data[parseInt(context.dataIndex)];
                                    label += ' : ' + Math.round(min  * 10) / 10 + '°/'+ Math.round(context.raw  * 10) / 10 + '°';
                                }**/
                                else{
                                    // other labels for tooltips
                                    var val = Math.round(context.raw  * 10) / 10;
                                    label += ' : ' + val + '°';
                                }
                                return label;
                            },
                            labelColor: function(context){
                                return{
                                    borderColor: context.dataset.borderColor,
                                    backgroundColor: context.dataset.borderColor,
                                    borderWidth: 2,
                                    borderRadius: 6,
                                };
                            },
                            labelTextColor: function(context) {
                                let bgColor = context.dataset.backgroundColor;
                                if (typeof bgColor != 'undefined'){
                                    var a = bgColor.split("(")[1].split(")")[0].split(",");
                                    a.splice(-1)
                                    var b = 'rgb(' + a[0] + ', ' + a[1] + ', ' + a[2] + ')';
                                    return b;
                                } else {
                                    return '#FAFCFE';
                                }
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
                                var lbl = this.getLabelForValue(index).toString();
                                    /**if (lbl.includes('.')){
                                        lbl = parseFloat(lbl)/0.01;
                                        return lbl + ' cm';
                                    }**/
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
    function updateData(cell_id, newData){
        // divide values into different sets
        var av_historical_51 = newData['arr_av_historical_51'];
        var max_historical_51 = newData['arr_max_historical_51'];
        var min_historical_51 = newData['arr_min_historical_51'];
        var av_preindustrial_51 = newData['arr_av_preindustrial_51'];
        var max_preindustrial_51 = newData['arr_max_preindustrial_51'];
        var min_preindustrial_51 = newData['arr_min_preindustrial_51'];
        var av_iceage_51 = newData['arr_av_iceage_51'];
        var max_iceage_51 = newData['arr_max_iceage_51'];
        var min_iceage_51 = newData['arr_min_iceage_51'];
        var years = ['ice age', 'pre industrial', 'historical']

        // setup datasets with new data for the trumpet curve
        trumpetChart.data.datasets.push({
                data: min_preindustrial_51,
                label: 'Min/Max ' +years[1],
                fill: '+1',
                backgroundColor: 'rgba(242,201,76,0.1)',
                borderColor: '#F2C94C',
            },
            {
                data: max_preindustrial_51,
                label: '_Max_ ' +years[1],
                fill: false,
                borderColor: '#F2C94C',
            },
            {
                data: av_preindustrial_51,
                label: 'Average ' +years[1],
                fill: false,
                borderColor: '#F2C94C',
            },
            {
                data: min_iceage_51,
                label: 'Min/Max ' +years[0],
                fill: '+1',
                backgroundColor: 'rgba(10,146,232,0.1)',
                borderColor: '#0A92E8',
            },
            {
                data: max_iceage_51,
                label: '_Max_ ' +years[0],
                fill: false,
                borderColor: '#0A92E8',
            },
            {
                data: av_iceage_51,
                label: 'Average ' +years[0],
                fill: false,
                borderColor: '#0A92E8',
            });
        trumpetChart.update(); // update chart
    }
