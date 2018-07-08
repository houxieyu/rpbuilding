//打开住户列表
$('#bt_caiji').click(function() {
	if(selft) {
		layui.use(['layer', 'table'], function() {
			$.get('layuimodule/zhuhulist.html', {}, function(str) {
				var layer = layui.layer;
				layer.full(layer.open({
					type: 1,
					content: str, //注意，如果str是object，那么需要字符拼接。
					area: '500px',
					shade: 0,
					offset: 't',
					title: '住户列表'
				}));

				try {
					$('#labeldbcode').text(selft.attributes.BuildCode);
					$('#labeldbname').text(selft.attributes.NAME);
					$('#labeldbrzhs').text(selft.attributes.rzhushu);
				} catch(e) {
					console.log(e.message)
				}
			});
		});
	} else {
		layui.layer.msg('请选中一个建筑物');
	}
});
//function openzhuhulist(){
//			layui.use(['layer', 'table'], function() {
//			$.get('layuimodule/zhuhulist.html', {}, function(str) {
//				var layer = layui.layer;
//				layer.full(layer.open({
//					type: 1,
//					content: str, //注意，如果str是object，那么需要字符拼接。
//					area: '500px',
//					shade: 0,
//					offset: 't',
//					title: '住户列表'
//				}));
//
//				try {
//					$('#labeldbcode').text(selft.attributes.BuildCode);
//					$('#labeldbname').text(selft.attributes.NAME);
//					$('#labeldbrzhs').text(selft.attributes.rzhushu);
//				} catch(e) {
//					console.log(e.message)
//				}
//			});
//		});
//}
//渲染表格（本地）
function loadTableLocal(storageitem, param, tableid, cols) {
	var ori_data = JSON.parse(plus.storage.getItem(storageitem));
	console.log(JSON.stringify(ori_data))
	if(ori_data == null) ori_data = [];
	var data = ori_data.filter(function(item) {
		return item[param.key].indexOf(param.value) == 0;
	})
	console.log(JSON.stringify(data))
	layui.use('table', function() {
			layui.table.render({
				elem: tableid,
				data: data,
				page: true, //开启分页
				done: function(res, curr, count) {},
				cols: cols
			});
	});
}
//渲染表格
function loadTable(method, param, tableid, cols) {
	$.ajax(serveraddr + method, {
		type: "POST",
		dataType: 'json',
		data: param,
		success: function(ret) {
			layui.table.render({
				elem: tableid,
				data: ret,
				page: true, //开启分页
				done: function(res, curr, count) {},
				cols: cols
			});
		}
	});
}
//提交数据到本地
function commitDataLocal(storageitem, msg, formdata, freshview, keyfield, keyvalue, isnew) {
	//处理表单字段
	var ori_data = JSON.parse(plus.storage.getItem(storageitem));
	if(!ori_data) ori_data = [];

	if(isnew) { //新增
		ori_data.push(formdata);
		console.log(ori_data);
		//关键字冲突检查
	} else { //修改
		var findidx = ori_data.findIndex(function(item) {
			return item[keyfield] == keyvalue;
		});
		if(findidx > -1) {
			ori_data[findidx] = formdata;
		}
	}
	//储存
	console.log(JSON.stringify(ori_data));
	plus.storage.setItem(storageitem, JSON.stringify(ori_data));
	layui.layer.msg(msg);
	//刷新列表
	if(freshview) freshview();
	layui.layer.close(layui.layer.index);
}
//提交数据
function commitData(method, msg, formid, freshview) {
	//处理表单字段
	var formdata = $(formid).serialize();
	// formdata += '&id='+$('#bdcode').val()+$('input[name="H1"]').val();
	$.ajax({
		//几个参数需要注意一下
		type: "POST", //方法类型
		dataType: "json", //预期服务器返回的数据类型
		url: serveraddr + method, //url
		data: formdata,
		success: function(result) {
			// console.log(result);//打印服务端返回的数据(调试用)
			layui.layer.msg(msg);
			freshview();
		},
		error: function(p1, p2) {
			// console.log(p1);
			layui.layer.msg(p1.responseText);
		}
	});
	layui.layer.close(layui.layer.index);
}

//弹出对话框
function openDialog(url, formid, title, initdata) {

	$.get(url, {}, function(str) {
		var layer = layui.layer;
		var layerparam = {
			type: 1,
			content: str, //注意，如果str是object，那么需要字符拼接。
			area: '500px',
			shade: 0,
			offset: 't',
			title: title,
			success: function() {
				layui.use(['form'], function() {
					try {
						console.log(JSON.stringify(initdata));
						layui.form.val(formid, initdata);
					} catch(e) {
						console.log(JSON.stringify(e))
					}
					layui.form.render();
				});
			}
			//			btn: btns
		};
		//		if(btns[0])layerparam.yes = btnfuncs[0];
		//		for(var i=1;i<btns.length;i++){
		//			layerparam['btn'+(i+1)] = btnfuncs[i];
		//		}
		//		console.log(JSON.stringify(layerparam.btn3))
		layer.full(layer.open(layerparam));
	});
}