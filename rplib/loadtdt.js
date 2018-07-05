define(["esri/layers/WebTiledLayer"],function(WebTiledLayer){
    function loadtdt(map){
                //加载天地图
                var tdurl = "http://\${subDomain}.tianditu.com/{servname}/wmts?" +
                "SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER={layer}&STYLE=default&TILEMATRIXSET={set}&FORMAT=tiles" +
                "&TILEMATRIX=\${level}&TILEROW=\${row}&TILECOL=\${col}";
            var tdvecurl = tdurl.replace('{servname}', 'vec_w').replace('{layer}', 'vec').replace('{set}', 'w');
            var tdsaturl = tdurl.replace('{servname}', 'img_w').replace('{layer}', 'img').replace('{set}', 'w');
            var tdterurl = tdurl.replace('{servname}', 'ter_w').replace('{layer}', 'ter').replace('{set}', 'w');
    
            var tdvecmkurl = tdurl.replace('{servname}', 'cva_w').replace('{layer}', 'cva').replace('{set}', 'w');
            var tdsatmurl = tdurl.replace('{servname}', 'cia_w').replace('{layer}', 'cia').replace('{set}', 'w');
            var tdtermurl = tdurl.replace('{servname}', 'cta_w').replace('{layer}', 'cta').replace('{set}', 'w');
            var tdlayerurls = [tdvecurl, tdsaturl, tdterurl];
            var tdmlayerurls = [tdvecmkurl, tdsatmurl, tdtermurl];
            var tileInfo = new esri.layers.TileInfo(tileInfoObj);
            var tdbaselayer = new WebTiledLayer(tdlayerurls[0], //"http://{subDomain}.tianditu.com/DataServer?T=vec_c&X={col}&Y={row}&L={level}",
                {
                    "copyright": '山东数研信息有限公司',
                    subDomains: ["t0", "t1", "t2"]
                    // ,tileInfo:tileInfoObj
                });
            map.addLayer(tdbaselayer);
    }
    return {loadtdt:loadtdt}
})