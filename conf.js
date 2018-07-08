var libpath = "http://124.133.27.90:6081/arcgis_js_api3.18/library/3.18/3.18";
// var libpath = "https://js.arcgis.com/3.24/";
// var libpath = "http://js.arcgis.com/3.14/";
var fsurl = 'http://124.133.27.90:6080/arcgis/rest/services/sdbj/FeatureServer/';
var serveraddr = "http://124.133.27.90:6083/";
var osmtileaddr = 'http://a.tile.openstreetmap.org/{level}/{col}/{row}.png';
var googletileaddr = 'http://{subDomain}.google.cn/vt/lyrs=m@167000000&hl=zh-CN&gl=cn&x={col}&y={row}&z={level}&s=Galil';
var googlesataddr = 'http://{subDomain}.google.cn/vt/lyrs=s&hl=zh-CN&gl=cn&x={col}&y={row}&z={level}'
var tdtsataddr = 'http://{subDomain}.tianditu.com/DataServer?T=img_w&X={col}&Y={row}&L={level}'
var tdtvecaddr = 'http://{subDomain}.tianditu.com/DataServer?T=vec_w&X={col}&Y={row}&L={level}'
var tdtcvaaddr = 'http://{subDomain}.tianditu.com/DataServer?T=cva_w&X={col}&Y={row}&L={level}'
var gdvecaddr = 'http://{subDomain}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={col}&y={row}&z={level}'
var gdsataddr = 'http://{subDomain}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={col}&y={row}&z={level}'
var tiledownaddr = tdtvecaddr;
var basemaps = [{
		name: 'open street map',
		value: 'osm'
	},
	{
		name: 'arcgis街道',
		value: 'streets'
	},
	{
		name: 'arcgis卫星',
		value: 'satellite'
	},
	{
		name: '谷歌街道',
		url: googletileaddr,
		subdomains: ['mt2']
	},
	{
		name: '谷歌卫星',
		url: googlesataddr,
		subdomains: ['mt2']
	},
	{
		name: '天地图街道',
		url: tdtvecaddr,
		subdomains: ["t0", "t1", "t2"]
	},
		{
		name: '天地图注记',
		url: tdtcvaaddr,
		subdomains: ["t0", "t1", "t2"]
	},
	{
		name: '天地图卫星',
		url: tdtsataddr,
		subdomains: ["t0", "t1", "t2"]
	},
	{
		name: '高德街道',
		url: gdvecaddr,
		subdomains: ["webrd01", "webrd02", "webrd03"]
	},
	{
		name: '高德卫星',
		url: gdsataddr,
		subdomains: ["webst01", "webst02", "webst03"]
	}
]
var downsource = [{
		name: 'open street map',
		url: osmtileaddr
	},
	{
		name: '谷歌街道',
		url: googletileaddr.replace('{subDomain}', 'mt2')
	},
	{
		name: '谷歌卫星',
		url: googlesataddr.replace('{subDomain}', 'mt2')
	},
	{
		name: '天地图街道',
		url: tdtvecaddr.replace('{subDomain}', 't0')
	},
	{
		name: '天地图卫星',
		url: tdtsataddr.replace('{subDomain}', 't0')
	},
		{
		name: '天地图注记',
		url: tdtcvaaddr.replace('{subDomain}', 't0')
	},
	{
		name: '高德街道',
		url: gdvecaddr.replace('{subDomain}', 'webrd01')
	},
	{
		name: '高德卫星',
		url: gdsataddr.replace('{subDomain}', 'webst01')
	}
]
//图片base64编码
function getBase64Image(img) {
	var canvas = document.createElement("canvas");
	canvas.width = img.width;
	canvas.height = img.height;
	var ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0, img.width, img.height);
	var ext = img.src.substring(img.src.lastIndexOf(".") + 1).toLowerCase();
	var dataURL = canvas.toDataURL("image/" + ext);
	return dataURL;
}

function downloadfile(url,filename){
		var dtask = plus.downloader.createDownload( url, {filename:'_doc/tiles/'+filename}, function ( d, status ) {
		// 下载完成
		if ( status == 200 ) { 
//			alert( "Download success: " + d.filename );
		} else {
//			 alert( "Download failed: " + status ); 
		}  
	});
	//dtask.addEventListener( "statechanged", onStateChanged, false );
	dtask.start(); 
}
function savefile(filename, imageblob) {

	plus.io.requestFileSystem(plus.io.PRIVATE_DOC, function(fs) {
		// 可通过fs操作PRIVATE_DOC文件系统 
		// ......
		fs.root.getFile('tiles/' + filename, {
			create: true
		}, function(fileEntry) {
			fileEntry.createWriter(function(writer) {
				// Write data to file.
				writer.write(imageblob);
			}, function(e) {
			console.log(imageblob)
				console.log(e.message);
			});
		});
	}, function(e) {
		console.log("Request file system failed: " + e.message);
	});
}

function requestblob(url,call) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = "blob";
	xhr.onload = function() {
		if(this.status == 200) {
			var blob = this.response;
			call(blob);
		}
	}
	xhr.send();
}

			//根据经纬度获取瓦片坐标和瓦片左上角经纬度
			function coordproc(x, y,tilelvl) {
				var tilexycoord = TileLnglatTransformGaode.lnglatToTile(x, y, tilelvl);
				var tilellcoord = TileLnglatTransformGaode.pixelToLnglat(0, 0, tilexycoord.tileX,
					tilexycoord.tileY, tilelvl);
				return {
					tilexycoord: TileLnglatTransformGaode.lnglatToTile(x, y, tilelvl),
					tilellcoord: TileLnglatTransformGaode.pixelToLnglat(0, 0, tilexycoord.tileX,
						tilexycoord.tileY, tilelvl)
				}

			}
			//获取瓦片左上角、右下角经纬度坐标
			function getcorner(x, y,tilelvl) {
				return {
					lt: TileLnglatTransformGaode.pixelToLnglat(-1, -1, x, y, tilelvl),
					rb: TileLnglatTransformGaode.pixelToLnglat(256, 256, x, y, tilelvl)
				};
			}