require([
	'rplib/coordtrans',
	"esri/map", "esri/graphicsUtils",
	"esri/layers/FeatureLayer",
	"dojo/parser", "esri/geometry/Extent",
	"dojo/domReady!"
], function(
	TileLnglatTransform,
	Map, graphicsUtils,
	FeatureLayer,
	parser, Extent
) {
	TileLnglatTransformGaode = TileLnglatTransform.TileLnglatTransformGaode;
	parser.parse();
	esri.config.defaults.io.corsEnabledServers.push('http://124.133.27.90:6080');
	//arcgis部分
	var areacode = '370102008015';
	//抓图核心
	var map = new Map("map", {
//		center: [117.05, 36.7],
//		zoom: 15
		//						basemap: 'osm'
	});
	map.height = 100;
	//依据区划码，过滤村级边界和建筑物图层
	//图层初始化参数
	function layerpars(DefinitionExpression) {
		this.mode = FeatureLayer.MODE_SNAPSHOT;
		this.outFields = ["*"];
		this.showLabels = false;
		this.minScale = 0;
		this.maxScale = 0;
		this.definitionExpression = DefinitionExpression;
	}
	var layerCunBJ = new FeatureLayer(fsurl + "3", new layerpars("AREA_CODE like '" + areacode +
		"%'"));
	map.addLayer(layerCunBJ);
	// 扩展API加载完毕后调用onPlusReady回调函数 
	document.addEventListener("plusready", onPlusReady, false);
	// 扩展API加载完毕，现在可以正常调用扩展API
	function onPlusReady() {
		function downtile(features) {
			// 根据地图平台使用转换类
			var ext = graphicsUtils.graphicsExtent(layerCunBJ.graphics);
//			console.log(ext)
			var tilelvl = 18;
			var arealt = coordproc(ext.xmin, ext.ymax, tilelvl);
			var arearb = coordproc(ext.xmax, ext.ymin, tilelvl);
			plus.storage.setItem("tileinfo", JSON.stringify({
				tilelvl: tilelvl,
				ext: ext,
				arealt: arealt,
				arearb: arearb
			}));
			//			console.log(plus.storage.getItem("tilearea"));
			var total = (arearb.tilexycoord.tileY - arealt.tilexycoord.tileY + 1) * (arearb.tilexycoord.tileX - arealt.tilexycoord.tileX + 1);
			$('#msg').empty();
			$('#msg').append('<p>总计下载' + total + '张瓦片地图，已下载<span id="downed">0</span>张</p>');
			for(tiley = arealt.tilexycoord.tileY; tiley <= arearb.tilexycoord.tileY; tiley++) {
				for(tilex = arealt.tilexycoord.tileX; tilex <= arearb.tilexycoord.tileX; tilex++) {
					var corner = getcorner(tilex, tiley, tilelvl);
					plus.storage.setItem("tilecorner", JSON.stringify(corner));
					var url = downsource[0].url.replace('{col}', tilex)
						.replace('{row}',
							tiley).replace('{level}', tilelvl);
					var filename = tilelvl + '-' + tilex + '-' + tiley + '.png';
					downloadfile(url, filename);
					$('#msg').append('<p>下载瓦片地图' + tilex + ',' + tiley + '</p>');
					$('#downed').text(parseInt($('#downed').text()) + 1);
				} //fory
			} //forx
		} //downtile
		//初始化
		var btninit = document.getElementById('btninit');
		//settingButton.style.display = settings.autoLogin ? 'block' : 'none';
		
		btninit.addEventListener('tap', function(event) {
			(function downdata(areacode) {
				//请求边界数据
				$.ajax('http://124.133.27.90:6080/arcgis/rest/services/sdbj/FeatureServer/3/query', {
					data: {
						where: 'AREA_CODE like \'' + areacode + '%\'',
						outFields: '*',
						//returnGeometry:true,
						f: 'pjson'
					},
					dataType: 'json',
					crossDomain: true,
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
					},
					success: function(result) {
//						console.log(result);
						//本地存储
						plus.storage.setItem("areabj_cun", JSON.stringify(result));
						//请求图片
						downtile(result.features);
					}
				});
				//请求建筑物数据
				var qt = new esri.tasks.QueryTask('http://124.133.27.90:6080/arcgis/rest/services/sdbj/FeatureServer/4');
				var query = new esri.tasks.Query();
				query.outFields = ['*'];
				query.returnGeometry = true;
				query.where = 'BuildCode like \'' + areacode + '%\'',
				qt.execute(query,function(ftset){
					plus.storage.setItem("areabuilding", JSON.stringify(ftset.features));
//					console.log(ftset.features);
				})
//				$.ajax('http://124.133.27.90:6080/arcgis/rest/services/sdbj/FeatureServer/4/query', {
//					data: {
//						where: 'BuildCode like \'' + areacode + '%\'',
//						outFields: '*',
//						//returnGeometry:true,
//						f: 'pjson'
//					},
//					dataType: 'json',
//					crossDomain: true,
//					headers: {
//						'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
//					},
//					success: function(result) {
//						//本地存储
//						plus.storage.setItem("areabuilding", JSON.stringify(result));
//					}
//				});
			})('370102008015');
			//清空建筑物数据
			plus.storage.removeItem("tablebuilding");
		}); //btninit
		
	} //ready

});