
$(window).on('map:init', function (e) {
    var detail = e.originalEvent ?
                 e.originalEvent.detail : e.detail;
    var db_data = "{{cg_data}}"

    var marker2 = L.marker([52.25, 12.75]).addTo(detail.map);

    var h = 0.5;
    var w = 0.5;
    var deltay = h/4;
    var deltax = w/2;
    var topLeftCorner = [52.25 + deltay, 12.75 - deltax];
    var topRightCorner = [52.25 + deltay, 12.75 + deltax];
    var bottomRightCorner = [52.25 - deltay, 12.75 + deltax];
    var bottomLeftCorner = [52.25 - deltay, 12.75 - deltax];

    var polygon1 = L.polygon([
        topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner
    ]).addTo(detail.map);
    content = "<h3 class=header3>Polygon1</h3><div><hr> You clicked inside a polygon</div>";
    polygon1.bindPopup(content);

    var topRightCorner2 = [52.25 + deltay, 12.75 + deltax*3];
    var bottomRightCorner2 = [52.25 - deltay, 12.75 + deltax*3];
    var polygon2 = L.polygon([
        topRightCorner, topRightCorner2 , bottomRightCorner2, bottomRightCorner
    ]).addTo(detail.map);

    /**L.TileLayer.Gird = L.TileLayer.extend({
        var latlng = L.latLng(52.25, 12.75)
        var h = 20.0;
        var w = 20.0;
        var deltay = h/2;
        var deltax = w/2;
        var topLeftCorner = L.latLng(52.25 - deltay - deltax);
        var bottomRightCorner = L.latLng(12.75 + deltay + deltax);
    });

    L.tileLayer.grid = function(){
        return new L.TileLayer.Grid();
    };

    detail.map.addLayer(L.titleLayer.grid());


    L.GridLayer.GridDebug = L.GridLayer.extend({
        createTitle: function (coords) {
            const title = document.createElement('div');
            title.style.outline = '1px solid green';
            title.style.fontWeight = 'bold';
            title.style.fontSize = '14pt';
            title.innerHTML = [coords.z, coords.x, coords.y].join('/');
            return title;
        },
    });

    L.gridLayer.gridDebug = function (opts) {
        return new L.GridLayer.GridDebug(opts);
    };

    map.addLayer(L.gridLayer.gridDebug());
**/
});