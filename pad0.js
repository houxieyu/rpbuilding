require([
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
], function (
    Map, BasemapToggle,
    dom, LabelClass, TextSymbol,
    Measurement, InfoWindow, Draw, Font,
    Edit, Graphic, Color, GeometryService,
    FeatureLayer, UniqueValueRenderer, PictureMarkerSymbol,
    SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, event, Query, AttributeInspector, domConstruct, Button,
    parser
) {
    parser.parse();
    esriConfig.defaults.geometryService = new GeometryService("https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
    // var infoWindow = new InfoWindow({}, domConstruct.create("div"));
    // infoWindow.startup();
    //初始化底图
    var map = new Map("map", {
        basemap: "osm",
        // infoWindow: infoWindow,
        center: [117.05, 36.7],
        zoom: 15,
        showLabels: true
    });
    //测量工具
    var measurement = new Measurement({
        map: map
    }, dom.byId("measurementDiv"));
    measurement.startup();
    //底图切换工具
    var toggle = new BasemapToggle({
        map: map,
        basemap: "satellite"
    }, "BasemapToggle");
    toggle.startup();

    //初始化边界、建筑物图层
    var areacode = '370102008015';
    var layerShiBJ = new FeatureLayer(fsurl + "0", new layerpars('1=2'));
    var layerXianBJ = new FeatureLayer(fsurl + "1", new layerpars('1=2'));
    var layerXiangBJ = new FeatureLayer(fsurl + "2", new layerpars('1=2'));
    //依据区划码，过滤村级边界和建筑物图层
    var layerCunBJ = new FeatureLayer(fsurl + "3", new layerpars("AREA_CODE like '" + areacode + "%'"));
    layerCunBJ.setShowLabels(true);
    var buildfilter = "BuildCode like '" + areacode + "%' or BuildCode is null";
    var layerBuilding = new FeatureLayer(fsurl + "4", new layerpars(buildfilter));
    //设置选中样式
    //要素拾取
    var symbol = new SimpleFillSymbol(
        SimpleFillSymbol.STYLE_SOLID,
        new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_SOLID,
            new Color([0, 255, 255]),
            1
        ),
        new Color([255, 0, 0, 0.5])
    );
    layerBuilding.setSelectionSymbol(symbol);
    //设置标签
    var statesLabel = new TextSymbol().setColor(new Color("#666"));
    statesLabel.font.setSize("10pt");
    statesLabel.font.setFamily("Microsoft YaHei");
    var json = {
        "labelExpressionInfo": {
            // "value": "{NAME} 住户：{rzhushu}"
            "value": "{NAME}"
        }
    };
    var labelClass = new LabelClass(json);
    labelClass.symbol = statesLabel;
    layerBuilding.setLabelingInfo([labelClass]);
    var layerinitpars = new layerpars(buildfilter);
    //建筑图标渲染图层
    var layerbuildingicon = new FeatureLayer(fsurl + "4", layerinitpars);
    //符号渲染器
    var iconrenderer = new UniqueValueRenderer(new PictureMarkerSymbol('images/build.png', 20, 20), "btype");
    iconrenderer.addValue('0', new PictureMarkerSymbol('images/house.png', 20, 20));
    iconrenderer.addValue('1', new PictureMarkerSymbol('images/commic.png', 20, 20));
    iconrenderer.addValue('2', new PictureMarkerSymbol('images/public.png', 20, 20));
    layerbuildingicon.setRenderer(iconrenderer);
    //标注渲染图层
    layerinitpars.visible = false;
    var layerbuildinglabel = new FeatureLayer(fsurl + "4", layerinitpars);

    function renderLabelLayer(showlabel) {
        if (!showlabel) {
            layerbuildinglabel.hide();
            return;
        } else {
            layerbuildinglabel.show();
        }
        //标注渲染器
        var labelrenderer = new UniqueValueRenderer(new TextSymbol(''), "OBJECTID");
        //查询图层属性
        // var queryTask = new QueryTask(fsurl+"4");
        // var query = new Query();
        // query.outFields = ["*"];
        // query.where = buildfilter;
        // queryTask.execute(query,function(fts){
        // });
        layerBuilding.graphics.forEach(ft => {
            // console.log(ft)
            labelrenderer.addValue({
                value: ft.attributes.OBJECTID,
                label: ft.attributes.rzhushu,
                symbol: new TextSymbol((ft.attributes.NAME ? (ft.attributes.NAME) : "") + (ft.attributes.rzhushu ? "\r\n入住户数：" + ft.attributes.rzhushu : "")).setColor(new Color("gray")).setFont(new Font("12px", Font.STYLE_NORMAL,
                    Font.VARIANT_NORMAL, Font.WEIGHT_NORMAL, "Microsoft Yahei"))
            });
        });
        layerbuildinglabel.setRenderer(labelrenderer);
        // layerbuildinglabel.setShowLabels(true);
        layerbuildinglabel.show();
        layerbuildinglabel.redraw();
    }

    // var layerBuilding = new FeatureLayer(fsurl + "4");
    layers = [layerShiBJ, layerXianBJ, layerXiangBJ, layerCunBJ, layerBuilding, layerbuildingicon, layerbuildinglabel];
    map.addLayers(layers);
    // map.addLayer(layerBuilding)
    //建筑物图层加载完成，将地图缩放至建筑物图层范围
    layerBuilding.on('update-end', function () {
        FullExtent();
    });
    //生成绘图工具
    map.on("load", createToolbar);
    //根据按钮属性，激活相应绘图工具
    var curtool = "";
    $('#ui button[data-type]').click(function () {
        activateDrawTool($(this).attr('data-type'));
        curtool = "";
        // $('#map *').css("cursor", "default");
    });
    //根据按钮属性，激活编辑工具
    $('#ui button[data-tool]').click(function () {
        curtool = $(this).attr('data-tool');
        if (curtool == 'edit' || curtool=='scale')
            activateEditTool(selft);
        else if (curtool == 'attr') {
            // event.stop(evt);
            // editToolbar.deactivate();
            // layerBuilding.clearSelection();
            // var selectQuery = new Query();
            // selectQuery.objectIds = [evt.graphic.attributes.OBJECTID];
            // layerBuilding.selectFeatures(selectQuery, FeatureLayer.SELECTION_NEW, function (features) {
            //     if (features.length > 0) {
            //store the current feature
            // updateFeature = features[0];
            updateFeature = selft;
            map.infoWindow.setTitle('属性编辑');
            map.infoWindow.show(curpoint, map.getInfoWindowAnchor(curpoint));
            $('.atiDeleteButton').removeClass('atiButton');
            $('.atiDeleteButton').addClass('dijitButton');
            // } else {
            //     map.infoWindow.hide();
            // }
            // });
        }
        // else
        // $('#map *').css("cursor", $(this).attr('data-cursor'));
    });
    var showlabel = false;
    //标注开关
    $('#bt_label').click(function () {
        layerBuilding.setShowLabels(showlabel = !showlabel);
        // renderLabelLayer(showlabel = !showlabel);
    });
    //点击到建筑物时，激活编辑工具
    layerBuilding.on("click", function (evt) {
        {
            haslayerclick = true;
            curpoint = evt.screenPoint;
            layerBuilding.clearSelection();
            var selectQuery = new Query();
            selectQuery.objectIds = [evt.graphic.attributes.OBJECTID];
            layerBuilding.selectFeatures(selectQuery, FeatureLayer.SELECTION_NEW, function (features) {});
            var selfts = layerBuilding.getSelectedFeatures();
            if (selfts.length > 0) selft = selfts[0];
        }
    });
    //属性编辑工具
    var layerInfos = [{
        'featureLayer': layerBuilding,
        'showAttachments': false,
        'isEditable': true,
        'fieldInfos': [{
                'fieldName': 'BuildCode',
                'isEditable': true,
                'label': '建筑编码:'
            },
            {
                'fieldName': 'ADDRESS',
                'isEditable': true,
                'label': '地址:'
            },
            {
                'fieldName': 'NAME',
                'isEditable': true,
                'label': '建筑名称:'
            },
            {
                'fieldName': 'btype',
                'isEditable': true,
                'label': '建筑类型:'
            },
            {
                'fieldName': 'LAYERNUM',
                'isEditable': true,
                'label': '层数:'
            },
            {
                'fieldName': 'UnitCount',
                'isEditable': true,
                'label': '房屋套数:'
            },
            {
                'fieldName': 'rzhushu',
                'isEditable': true,
                'label': '入住户数:'
            }
        ]
    }];
    var attInspector = new AttributeInspector({
        layerInfos: layerInfos
    }, domConstruct.create("div"));
    //添加保存按钮
    var saveButton = new Button({
        label: "保存"
    }, domConstruct.create("button", {
        style: {
            color: "red"
        }
    }));
    domConstruct.place(saveButton.domNode, attInspector.deleteBtn.domNode, "after");
    // console.log(attInspector.editButtons)

    saveButton.on("click", function () {
        updateFeature.getLayer().applyEdits(null, [updateFeature], null);
        layerbuildingicon.applyEdits(null, [updateFeature], null);
        map.infoWindow.hide();
        layerbuildingicon.redraw();
    });
 
    //修改属性
    attInspector.on("attribute-change", function (evt) {
        //store the updates to apply when the save button is clicked
        updateFeature.attributes[evt.fieldName] = evt.fieldValue;
    });

    attInspector.on("next", function (evt) {
        updateFeature = evt.feature;
        // console.log("Next " + updateFeature.attributes.OBJECTID);
    });

    attInspector.on("delete", function (evt) {
        if (confirm("确定删除？") == true) {
            evt.feature.getLayer().applyEdits(null, null, [evt.feature]);
            map.infoWindow.hide();
        }
    });

    map.infoWindow.setContent(attInspector.domNode);
//  map.infoWindow.resize(400,300);
    //地图缩放至建筑物图层
    function FullExtent() {
        //map.setExtent(featureLayer.fullExtent);
        require([
            "esri/graphicsUtils", "dojo/domReady!"
        ], function (graphicsUtils) {
            if (layerBuilding.graphics.length > 0) {
                var myFeatureExtent = graphicsUtils.graphicsExtent(layerBuilding.graphics);
                map.setExtent(myFeatureExtent);
            }
        });
    }

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
        toolbar = new Draw(map);
        toolbar.on("draw-end", addToMap);
        editToolbar = new Edit(map);
        //点击到底图时，取消编辑工具
        map.on("click", function (evt) {
            editToolbar.deactivate();
            if (!haslayerclick) {
                layerBuilding.clearSelection();
            }
            layui.use(['layer'], function () {
                layui.layer.closeAll();
            });
            haslayerclick = false;
        });

        editToolbar.on("deactivate", function (evt) {
            layerBuilding.applyEdits(null, [evt.graphic], null);
        });
    }
    //将绘制完的图形添加到图层
    function addToMap(evt) {
        var symbol;
        toolbar.deactivate();
        map.showZoomSlider();
        switch (evt.geometry.type) {
            case "point":
            case "multipoint":
                symbol = new SimpleMarkerSymbol();
                break;
            case "polyline":
                symbol = new SimpleLineSymbol();
                break;
            default:
                symbol = new SimpleFillSymbol();
                break;
        }
        // var graphic = new Graphic(evt.geometry, symbol);
        // map.graphics.add(graphic);

        //var newAttributes = lang.mixin({}, selectedTemplate.template.prototype.attributes);
        var newGraphic = new Graphic(evt.geometry, null, {
            BuildCode: areacode,
            btype: 0
        });
        layerBuilding.applyEdits([newGraphic], null, null, function () {
            layerbuildingicon.refresh();
        });

        // newGraphic = new Graphic(evt.geometry, null, {BuildCode:areacode,btype:0});
        // layerbuildingicon.applyEdits([newGraphic], null, null);

    }
    //激活编辑工具
    function activateEditTool(graphic) {
        var tool = 0;
        tool = tool | Edit.MOVE;
        if(curtool=='edit'){
            tool = tool | Edit.EDIT_VERTICES;
        }
        else {
        tool = tool | Edit.SCALE;
        tool = tool | Edit.ROTATE;
        }
        var options = {
            //   allowAddVertices: registry.byId("vtx_ca").checked,
            //   allowDeleteVertices: registry.byId("vtx_cd").checked,
            //   uniformScaling: registry.byId("uniform_scaling").checked
        };
        editToolbar.activate(tool, graphic, options);
    }


});