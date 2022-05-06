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
        positiveX : './Cesium/Assets/Textures/SkyBox/tycho2t3_80_px.png',
        negativeX : './Cesium/Assets/Textures/SkyBox/tycho2t3_80_mx.png',
        positiveY : './Cesium/Assets/Textures/SkyBox/tycho2t3_80_py.png',
        negativeY : './Cesium/Assets/Textures/SkyBox/tycho2t3_80_my.png',
        positiveZ : './Cesium/Assets/Textures/SkyBox/tycho2t3_80_pz.png',
        negativeZ : './Cesium/Assets/Textures/SkyBox/tycho2t3_80_mz.png'
    }
});

/**
parsing data from backend
**/
var data = JSON.parse(JSON.parse(document.getElementById('grid_data').textContent));
var cg = JSON.parse(document.getElementById('cg_data').textContent);
console.log('cg data: ', cg);
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
            geoJsonArray[i].properties["t_av_all_51"] = cg[data.features[i].properties.id].t_av_all_51;
            geoJsonArray[i].properties["t_max_all_51"] = cg[data.features[i].properties.id].t_max_all_51;
            geoJsonArray[i].properties["t_min_all_51"] = cg[data.features[i].properties.id].t_min_all_51;
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
function hslToRgb(h, s, l){
    s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) , f(8), f(4)];
}

function addAlpha(color, opacity){
    // coerce values so ti is between 0 and 1.
    const _opacity = Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255);
    return color + _opacity.toString(16).toUpperCase();
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
console.log('geo json array:', geoJsonArray[170]);
for (var j = 0; j < geoJsonArray.length; j++){
    let c = getColor(geoJsonArray[j].properties["t_av_all_51"], -40, 10);
    let ac = addAlpha(c, 0.5)
    console.log('new color: ', c, ' with alpha: ', ac);
    viewer.dataSources.add(Cesium.GeoJsonDataSource.load(geoJsonArray[j], {
        clampToGround: true,
        stroke: Cesium.Color.fromCssColorString(c),
        fill: Cesium.Color.fromCssColorString(c),
        strokeWidth: 3,
        markerSymbol: '?'
    }));
}
/**
promise
    .then(function (dataSource){
        viewer.dataSources.add(dataSource);
        const entities = dataSource.entities.values;
        const colorHash = {};

        for(let i = 0; i < entities.length; i++){
            const entity = entities[i];
            const tmp = entity.properties["t_av_all_51"];
            let color = colorHash[tmp];
            if(!color){
                color = Cesium.Color(getColor(geoJsonArray[j].properties["t_av_all_51"], -10, 15));
                colorHash[tmp] = color;
            }

            entity.polygon.material = color;
            entity.polygon.outline = false;
        }

    })
    .catch(function(error){
        window.alert(error);
    });
**/



// Add Cesium OSM Buildings, a global 3D buildings layer.
const tileset = viewer.scene.primitives.add(
    new Cesium.Cesium3DTileset({
        url: Cesium.IonResource.fromAssetId(96188),
    })
);
