define([], function () {
    function loadtiles( url, subdomains) {
        var tdbaselayer = new WebTiledLayer(url, //"http://{subDomain}.tianditu.com/DataServer?T=vec_c&X={col}&Y={row}&L={level}",
            {
                "copyright": '山东数研信息有限公司',
                subDomains: subdomains
                // ,tileInfo:tileInfoObj
            });
        map.addLayer(tdbaselayer,0);
    };
    return {loadtiles: loadtiles }
});