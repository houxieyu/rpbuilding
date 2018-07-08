var selft;
require([
	'rplib/coordtrans',
	"esri/map", "esri/dijit/BasemapToggle",
	"dojo/dom", "esri/layers/LabelClass", "esri/symbols/TextSymbol",
	"esri/dijit/Measurement", "esri/dijit/InfoWindow",
	"esri/toolbars/draw", "esri/symbols/Font",
	"esri/toolbars/edit",
	"esri/graphic", "esri/Color",
	"esri/tasks/GeometryService",
	"esri/layers/FeatureLayer",
	"esri/renderers/UniqueValueRenderer",
	"esri/symbols/PictureMarkerSymbol",
	"esri/symbols/SimpleMarkerSymbol",
	"esri/symbols/SimpleLineSymbol",
	"esri/symbols/SimpleFillSymbol",
	"dojo/_base/event", "esri/tasks/query", "esri/dijit/AttributeInspector", "dojo/dom-construct", "dijit/form/Button",
	"dojo/parser",
	"dojo/domReady!"
], function(
	TileLnglatTransform,
	Map, BasemapToggle,
	dom, LabelClass, TextSymbol,
	Measurement, InfoWindow, Draw, Font,
	Edit, Graphic, Color, GeometryService,
	FeatureLayer, UniqueValueRenderer, PictureMarkerSymbol,
	SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, event, Query, AttributeInspector, domConstruct, Button,
	parser
) {
	TileLnglatTransformGaode = TileLnglatTransform.TileLnglatTransformGaode;
	parser.parse();
	esriConfig.defaults.geometryService = new GeometryService("https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
	// var infoWindow = new InfoWindow({}, domConstruct.create("div"));
	// infoWindow.startup();
	// 扩展API加载完毕后调用onPlusReady回调函数 
	document.addEventListener("plusready", onPlusReady, false);
	// 扩展API加载完毕，现在可以正常调用扩展API
	function onPlusReady() {
		var tileinfo = JSON.parse(plus.storage.getItem("tileinfo"));
		//初始化底图
		map = new Map("map", {
			//			basemap: "streets",
			// infoWindow: infoWindow,
			center: [117.05, 36.7],
			zoom: 15,
			showLabels: true
		});
		//测量工具
		//	var measurement = new Measurement({
		//		map: map
		//	}, dom.byId("measurementDiv"));
		//	measurement.startup();
		//底图切换工具
		//	var toggle = new BasemapToggle({
		//		map: map,
		//		basemap: "satellite"
		//	}, "BasemapToggle");
		//	toggle.startup();

		//初始化边界、建筑物图层
		var areacode = '370102008015';
		var layerShiBJ = new FeatureLayer(fsurl + "0", new layerpars('1=2'));
		var layerXianBJ = new FeatureLayer(fsurl + "1", new layerpars('1=2'));
		var layerXiangBJ = new FeatureLayer(fsurl + "2", new layerpars('1=2'));
		//依据区划码，过滤村级边界和建筑物图层
		var layerCunBJ = new FeatureLayer(fsurl + "3", new layerpars("AREA_CODE like '" + areacode + "%'"));
		layerCunBJ.setShowLabels(true);
		var buildfilter = "BuildCode like '" + areacode + "%' or BuildCode is null";
		//设置选中样式
		//要素拾取
		var selectionsymbol = new SimpleFillSymbol(
			SimpleFillSymbol.STYLE_SOLID,
			new SimpleLineSymbol(
				SimpleLineSymbol.STYLE_SOLID,
				new Color([0, 255, 255]),
				1
			),
			new Color([255, 0, 0, 0.5])
		);

		//边界图层加载完成，将地图缩放至边界图层范围
		layerCunBJ.on('update-end', function() {
			FullExtent(tileinfo);
			map.setScale(2000);
		});
		//地图缩放至普查区范围
		function FullExtent(tileinfo) {
			if(tileinfo) {
				tileinfo.ext.spatialReference.wkid = 4326;
				map.setExtent(new esri.geometry.Extent(tileinfo.ext));
			}
		}
		//加载离线地图
		function loadlxmap(tileinfo) {
			mil.removeAllImages();

			var arealt = tileinfo.arealt;
			var arearb = tileinfo.arearb;
			plus.io.requestFileSystem(plus.io.PRIVATE_DOC, function(fs) {
				for(tiley = arealt.tilexycoord.tileY; tiley <= arearb.tilexycoord.tileY; tiley++) {
					for(tilex = arealt.tilexycoord.tileX; tilex <= arearb.tilexycoord.tileX; tilex++) {
						var corner = getcorner(tilex, tiley, tileinfo.tilelvl);
						var filename = tileinfo.tilelvl + '-' + tilex + '-' + tiley + '.png';
						fs.root.getFile('tiles/' + filename, {}, function(corner) {
							return function(fileEntry) {
								var mi = new esri.layers.MapImage({
									'extent': {
										'xmin': corner.lt.lng,
										'ymin': corner.rb.lat,
										'xmax': corner.rb.lng,
										'ymax': corner.lt.lat,
										'spatialReference': {
											'wkid': 4326
										}
									},
									'href': fileEntry.toLocalURL()
								});
								mil.addImage(mi);
							}
						}(corner));
					}
				}
			});
		}

		//离线底图图层
		var mil = new esri.layers.MapImageLayer();
		map.addLayer(mil);
		loadlxmap(tileinfo);
		//加载边界图层、建筑物
		layers = [layerShiBJ, layerXianBJ, layerXiangBJ, layerCunBJ];
		map.addLayers(layers);
		//绘制建筑物		
		var buildings = JSON.parse(plus.storage.getItem("areabuilding"));
		var buildsymbol = new SimpleFillSymbol();
		buildings.forEach(ft => {
			map.graphics.add(new Graphic(new esri.geometry.Polygon(ft.geometry), buildsymbol, ft.attributes));
		});

		//生成绘图工具
		createToolbar();
		//		map.on("load", createToolbar);
		//根据按钮属性，激活相应绘图工具
		var curtool = "";
		$('#ui button[data-type]').click(function() {
			activateDrawTool($(this).attr('data-type'));
			curtool = "";
			// $('#map *').css("cursor", "default");
		});
		//根据按钮属性，激活编辑工具
		$('#ui button[data-tool]').click(function() {
			curtool = $(this).attr('data-tool');
			if(curtool == 'edit' || curtool == 'scale') {
				activateEditTool(selft);
			} else if(curtool == 'attr') {

				updateFeature = selft;
				map.infoWindow.setTitle('属性编辑');
				map.infoWindow.show(curpoint, map.getInfoWindowAnchor(curpoint));
				$('.atiDeleteButton').removeClass('atiButton');
				$('.atiDeleteButton').addClass('dijitButton');
			}
		});
		var showlabel = false;
		//标注开关
		$('#bt_label').click(function() {});

		//点击到建筑物时，激活编辑工具
		map.graphics.on("click", function(evt) {
			//			console.log('graphic click')
			if(selft)
				selft.setSymbol(buildsymbol);
			if(selft == evt.graphic) {
				selft = null;
			} else {
				evt.graphic.setSymbol(selectionsymbol);
				selft = evt.graphic;
			}
			haslayerclick = true;
			curpoint = evt.screenPoint;
		});

		$('#bt_triangle').click(function() {
			location.reload(true);
			return;

		})

		//图层初始化参数
		function layerpars(DefinitionExpression) {
			this.mode = FeatureLayer.MODE_SNAPSHOT;
			this.outFields = ["*"];
			this.showLabels = false;
			this.minScale = 0;
			this.maxScale = 0;
			this.definitionExpression = DefinitionExpression;
		}

		//激活绘图工具
		function activateDrawTool(tooltype) {
			toolbar.activate(Draw[tooltype]);
			map.hideZoomSlider();
		}
		var haslayerclick = false;
		//生成绘图工具
		function createToolbar(themap) {
			//			console.log('toolbar')
			toolbar = new Draw(map);
			toolbar.on("draw-end", addToMap);
			editToolbar = new Edit(map);
			//点击到底图时，取消编辑工具
			map.on("click", function(evt) {
				//				console.log('map click')
				editToolbar.deactivate();
				if(!haslayerclick) {
					//					console.log('unselect')
					if(selft) selft.setSymbol(buildsymbol);
					selft = null;
				}
				layui.use(['layer'], function() {
					layui.layer.closeAll();
				});
				haslayerclick = false;
			});

			editToolbar.on("deactivate", function(evt) {
				map.enablePan();
			});
		}

		//将绘制完的图形添加到图层
		function addToMap(evt) {

			toolbar.deactivate();
			map.showZoomSlider();
			switch(evt.geometry.type) {
				case "point":
				case "multipoint":
					buildsymbol = new SimpleMarkerSymbol();
					break;
				case "polyline":
					buildsymbol = new SimpleLineSymbol();
					break;
				default:
					buildsymbol = new SimpleFillSymbol();
					break;
			}
			//			 var graphic = new Graphic(evt.geometry, symbol);

			//var newAttributes = lang.mixin({}, selectedTemplate.template.prototype.attributes);
			var newGraphic = new Graphic(evt.geometry, buildsymbol, {
				BuildCode: areacode,
				btype: 0
			});
			//			console.log('add to layer')
			map.graphics.add(newGraphic);
			var gps = [];
			map.graphics.graphics.forEach(function(item) {
				gps.push({
					geometry: item.geometry,
					attributes: item.attributes
				});
			});
			plus.storage.setItem("areabuilding", JSON.stringify(gps));
			//						console.log(map.graphics)

		}
		//激活编辑工具
		function activateEditTool(graphic) {
			var tool = 0;
			tool = tool | Edit.MOVE;
			if(curtool == 'edit') {
				tool = tool | Edit.EDIT_VERTICES;
			} else {
				tool = tool | Edit.SCALE;
				tool = tool | Edit.ROTATE;
			}
			var options = {
				//   allowAddVertices: registry.byId("vtx_ca").checked,
				//   allowDeleteVertices: registry.byId("vtx_cd").checked,
				//   uniformScaling: registry.byId("uniform_scaling").checked
			};
			editToolbar.activate(tool, graphic, options);
			map.disablePan();
		}

		//打开建筑信息
		$('#bt_caijibuild').click(function() {
			if(!selft) {
				layui.layer.msg('请选中一个建筑物');
			}
			//查询建筑物信息
			tablebuilding = JSON.parse(plus.storage.getItem("tablebuilding"));
			var buildinfo;
			if(tablebuilding) {
				buildinfo = tablebuilding.find(function(item) {
					return item.id == selft.attributes.bdcode;
				});
				console.log(JSON.stringify(selft.attributes));
				console.log(JSON.stringify(tablebuilding));
				console.log(JSON.stringify(buildinfo));
			}

			if(buildinfo === undefined) {
				buildinfo = {
					"pcqcode": areacode,
					"B1": '001',
					"B2": '',
					"B3": 1,
					"B4": 1,
					"B5": 1,
					"B6": 1,
					"B7_1": 0,
					"B7_2": 0,
					"B7_3": 0,
					"B7_4": 0,
					"B8": 1,
					"B9": 1,
					"B10": 1,
					"B11": 1,
					"B12": 1,
					"B13": 1,
					"B14": 1
				};
				buildinfo.isnew = true;
				openbuilddialog(buildinfo);//, addBuild);
				//				opoenBuildWindow(buildinfo, true);
			} else {
				buildinfo.isnew = false;
				openbuilddialog(buildinfo);//, updateBuild);
				//				opoenBuildWindow(buildinfo, false);
			}
		});

		//打开建筑物信息window
		function opoenBuildWindow(initdata, isnew) {
			mui.openWindow({
				url: 'layuimodule/buildedit_lx_plus.html',
				extras: {
					initdata: initdata, //扩展参数
					isnew: isnew
				}
			});
		}
		//打开建筑物信息页面
		function openbuilddialog(initdata){//, yesfunc) {
			openDialog('layuimodule/buildedit_lx.html', 'buildform', '建筑物信息', initdata);
//			, ['保存', '关闭', '住户信息'], funcs);

		}

	} //ready

});

var formparams;