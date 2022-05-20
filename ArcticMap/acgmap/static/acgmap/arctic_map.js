// Your access token can be found at: https://cesium.com/ion/tokens.
// This is the default access token from your ion account

//Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkMTU2OWE4Mi01YjkwLTRiZjYtOWYxMC00M2NmYjI2MTgzOWUiLCJpZCI6ODc1OTgsImlhdCI6MTY0ODcxNzgyNn0.QCtgrJaz2qBi-y4d02uLG-W5tfKitz1UlANQxhV7-2E';
//Cesium.Ion.defaultAccessToken = null; //'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkMTU2OWE4Mi01YjkwLTRiZjYtOWYxMC00M2NmYjI2MTgzOWUiLCJpZCI6ODc1OTgsImlhdCI6MTY0ODcxNzgyNn0.QCtgrJaz2qBi-y4d02uLG-W5tfKitz1UlANQxhV7-2E';
Cesium.BingMapsApi.defaultKey = 'AvgY2m7VyKZj6P0MLanxAsLwy6gN4OdbJWKoXkIRQSbcPWRMa0wtHc3pVFFHA1to';

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
const viewer = new Cesium.Viewer('cesiumContainer', {
    imageryProvider: new Cesium.BingMapsImageryProvider({
        url : 'https://dev.virtualearth.net',
        key : Cesium.BingMapsApi.defaultKey ,
        mapStyle : Cesium.BingMapsStyle.AERIAL_WITH_LABELS
    }),
    requestRenderMode: true,
    maximumRenderTimeChange: Infinity,
    timeline: false,
    animation: false,
    baseLayerPicker: false,
    sceneModePicker: false,
});

var scene = viewer.scene;

scene.skyBox = new Cesium.SkyBox({
    sources : {
        positiveX : positiveX,
        negativeX : negativeX,
        positiveY : positiveY,
        negativeY : negativeY,
        positiveZ : positiveZ,
        negativeZ : negativeZ
    }
});

/**
parsing data from backend
**/
var data = JSON.parse(JSON.parse(document.getElementById('grid_data').textContent));
var cg = JSON.parse(document.getElementById('cg_data').textContent);
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
                       "popupContent": " This is a Cell number: " + data.features[i].properties.id},
        "geometry": {"type": "Polygon", "coordinates": [
            [[data.features[i].properties.left, data.features[i].properties.top],
            [data.features[i].properties.right, data.features[i].properties.top],
            [data.features[i].properties.right, data.features[i].properties.bottom],
            [data.features[i].properties.left, data.features[i].properties.bottom]]
            ]}
        });
        if(cg[data.features[i].properties.id] != null){
            geoJsonArray[i].properties["t_av_preindustrial_51"] = cg[data.features[i].properties.id].t_av_preindustrial_51;
            geoJsonArray[i].properties["t_max_preindustrial_51"] = cg[data.features[i].properties.id].t_max_preindustrial_51;
            geoJsonArray[i].properties["t_min_preindustrial_51"] = cg[data.features[i].properties.id].t_min_preindustrial_51;
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

function addAlpha(color, opacity){
    // coerce values so ti is between 0 and 1.
    const _opacity = Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255);
    return color + _opacity.toString(16).toUpperCase();
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

function pickHex(col_start, col_end, weight){
    var w1 = weight/255;
    var w2 = 1 - w1;
    var rgb = [Math.round(col_start[0] * w1 + col_end[0] * w2),
        Math.round(col_start[1] * w1 + col_end[1] * w2),
        Math.round(col_start[2] * w1 + col_end[2] * w2)];
    return rgb;
}

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
for (var j = 0; j < geoJsonArray.length; j++){
    let hex_col = getHexCol(geoJsonArray[j].properties["t_av_preindustrial_51"]);
    let rgba_col = hexToRgbA(hex_col);
    //console.log('temperature of: ', geoJsonArray[j].properties["t_av_preindustrial_51"]);
    //console.log('new color: ', hex_col, ' with alpha: ', rgba_col);
    viewer.dataSources.add(Cesium.GeoJsonDataSource.load(geoJsonArray[j], {
        clampToGround: true,
        stroke: Cesium.Color.fromCssColorString(hex_col),
        fill: Cesium.Color.fromCssColorString(rgba_col),
        strokeWidth: 5,
        markerSymbol: '?'
    }));
}


// chart implementation
setTimeout(function(){
    var cssLink = document.createElement("link");
    cssLink.href = Cesium.buildModuleUrl('./static/acgmap/arctic_style.css');
    cssLink.rel = "stylesheet";
    cssLink.type = "text/css";
    viewer.infoBox.frame.contentDocument.head.appendChild(cssLink);
}, 5000);




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
        const labels = [0.01, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0 ];
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
                                if (label.includes('Min/Max')){
                                    let max = trumpetChart.data.datasets[parseInt(context.datasetIndex) + 1].data[parseInt(context.dataIndex)];
                                    label += ' : ' + Math.round(context.raw * 10) / 10 + '°/'+ Math.round(max * 10) / 10 + '°';
                                }
                                else if (label.includes('10%/90%')){
                                    let min = trumpetChart.data.datasets[parseInt(context.datasetIndex) + 1].data[parseInt(context.dataIndex)];
                                    label += ' : ' + Math.round(min  * 10) / 10 + '°/'+ Math.round(context.raw  * 10) / 10 + '°';
                                }
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

        // divide values into different sets
        for (var i = 1; i < 16; i++){
            min.push(newData[i]['min']);
            max.push(newData[i]['max']);
            mean.push(newData[i]['mean']);
            median.push(newData[i]['median']);
            max_quantile.push(newData[i]['max_quantile']);
            min_quantile.push(newData[i]['min_quantile'])
        }

        // set colors for different sets
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
        trumpetChart.update(); // update chart
    }
