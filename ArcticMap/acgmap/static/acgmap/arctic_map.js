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
console.log('geo json array:', geoJsonArray);
for (var j = 0; j < geoJsonArray.length; j++){
    viewer.dataSources.add(Cesium.GeoJsonDataSource.load(geoJsonArray[j], {
        clampToGround: true,
        stroke: Cesium.Color.HOTPINK,
        strokeWidth: 3,
        markerSymbol: '?'
    }));
}

// Add Cesium OSM Buildings, a global 3D buildings layer.
const tileset = viewer.scene.primitives.add(
    new Cesium.Cesium3DTileset({
        url: Cesium.IonResource.fromAssetId(96188),
    })
);


// Fly the camera to San Francisco at the given longitude, latitude, and height.
viewer.camera.flyTo({
    destination : Cesium.Cartesian3.fromDegrees(-122.4175, 37.655, 400),
    orientation : {
        heading : Cesium.Math.toRadians(0.0),
        pitch : Cesium.Math.toRadians(-15.0),
    }
});