var libpath = "http://124.133.27.90:6081/arcgis_js_api3.18/library/3.18/3.18";
// var libpath = "https://js.arcgis.com/3.24/";
// var libpath = "http://js.arcgis.com/3.14/";
var fsurl = 'http://124.133.27.90:6080/arcgis/rest/services/sdbj/FeatureServer/';
var serveraddr = "http://localhost:6083/";
var osmtileaddr = 'http://a.tile.openstreetmap.org/{level}/{col}/{row}.png';
var googletileaddr = 'http://{subDomain}.google.cn/vt/lyrs=m@167000000&hl=zh-CN&gl=cn&x={col}&y={row}&z={level}&s=Galil';
var googlesataddr = 'http://{subDomain}.google.cn/vt/lyrs=s&hl=zh-CN&gl=cn&x={col}&y={row}&z={level}'
var tdtsataddr = 'http://{subDomain}.tianditu.com/DataServer?T=img_w&X={col}&Y={row}&L={level}'
var tdtvecaddr = 'http://{subDomain}.tianditu.com/DataServer?T=vec_w&X={col}&Y={row}&L={level}'
var gdvecaddr = 'http://{subDomain}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={col}&y={row}&z={level}'
var gdsataddr = 'http://{subDomain}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={col}&y={row}&z={level}'
var tiledownaddr=tdtvecaddr;
var basemaps = [{name:'open street map',value:'osm'},
    {name:'arcgis街道',value:'streets'},
    {name:'arcgis卫星',value:'satellite'},
    {name:'谷歌街道',url:googletileaddr,subdomains:['mt2']},
    {name:'谷歌卫星',url:googlesataddr,subdomains:['mt2']},
    {name:'天地图街道',url:tdtvecaddr,subdomains:["t0", "t1", "t2"]},
    {name:'天地图卫星',url:tdtsataddr,subdomains:["t0", "t1", "t2"]},
    {name:'高德街道',url:gdvecaddr,subdomains:["webrd01", "webrd02", "webrd03"]},
    {name:'高德卫星',url:gdsataddr,subdomains:["webst01", "webst02", "webst03"]}]
var downsource = [{name:'open street map',url:osmtileaddr},
{name:'谷歌街道',url:googletileaddr.replace('{subDomain}','mt2')},
{name:'谷歌卫星',url:googlesataddr.replace('{subDomain}','mt2')},
{name:'天地图街道',url:tdtvecaddr.replace('{subDomain}','t0')},
{name:'天地图卫星',url:tdtsataddr.replace('{subDomain}','t0')},
{name:'高德街道',url:gdvecaddr.replace('{subDomain}','webrd01')},
{name:'高德卫星',url:gdsataddr.replace('{subDomain}','webst01')}]
