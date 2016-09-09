$(function(){
	// alert("content.js");

	function getUrlParam(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
        var r = window.location.search.substr(1).match(reg);  //匹配目标参数
        if (r != null) return unescape(r[2]); return null; //返回参数值
    }

	chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
	    if (msg.text) {
	    	if(msg.text == "get_orders"){
	    		var markStyle = msg.markStyle;//包含的标记类型
	    		var times = msg.times;
	    		if(times==0 && !$(".pagination-prev").hasClass("pagination-disabled")){
	    			if(confirm("使用小公举统计订单前，需要刷新本页面，是否刷新？")){
	    				location.reload();
	    			}
	    		}else{
		    		var result = getOrderIDs(markStyle); 
		    		sendResponse({orders:result,hasNext:!$("li.pagination-next").hasClass("pagination-disabled")});
		    		if($("li.pagination-next").hasClass("pagination-disabled")){

		    		}else{
		    			nextPage();
		    		}
	    		}
	    	}else if(msg.text == "get_mark_by_id"){
	    		$.ajax({
	                url : "https://trade.taobao.com/trade/json/memoInfo.htm?user_type=seller&_input_charset=utf-8&orderid="+msg.id,
	                type : 'get',
	                dataType : 'json',
	                timeout : 3000,
	                cache : false,
	                async : false, 
	                complete : function(data){sendResponse(data)},
	                success : function(data)
	                {
	                	console.log(data)
	                	var dt = {id:msg.id,tip:data.tip};
	                  	sendResponse(dt);
	                }
	          });
	    	}
	    }
	});

	window.getOrderIDs = function(markStyle){
		var its = getCurrentOrderIds(markStyle);
      	chrome.storage.local.get("orders",function(result1){
  			if(its.length>0)
  			{
	      		var orders = result1==undefined||result1.orders==undefined?[]:result1.orders;
      			for(var i=0;i<its.length;i++){
      				orders.push(its[i]);
      			}
	      		chrome.storage.local.set({orders:orders});
  			}
      	});
      	return its;
	}

	window.fillOrders = function(){
		chrome.storage.local.get("orders",function(result){
  			var orders = result.orders==undefined?[]:result.orders;
  			var selected_orders = [];
  			for(var i=0;i<orders.length;i++){
  				var order = orders[i];
  				if(order.selected){
  					selected_orders.push(order);
  				}
  			}
  			var txt = "";
  			var fillIndex = parseInt(getUrlParam("fill_index"));
  			var loopend = selected_orders.length>fillIndex+20?fillIndex+20:selected_orders.length;
  			for(var i=fillIndex;i<loopend;i++){
  				var order = selected_orders[i];
				txt += order.id + "\n";
  			}
  			$("textarea.tb-input-hint").val(txt);
  			setTimeout(function(){
  				chrome.storage.local.set({staus:"fill-orders-complete"});
  			},2000);
      	});
	}

	window.markOrders = function(){
		chrome.storage.local.set({staus:"start_mark_orders"},function(){
			var url = "https://trade.taobao.com/trade/itemlist/list_sold_items.htm";
			window.open(url,"_self");
		});
	}

	window.openMarkOrdersPage = function(){
		window.hasSomeOrderToMark = false;
		$("div.trade-order-main").each(function(){
			var order_div = $(this);
			var id = order_div.data("reactid").split("$")[1];
			if(window.selected_orders[id]!=undefined){
				order_div.find("input").click();
				window.hasSomeOrderToMark = true;
			}
		});
		if(window.hasSomeOrderToMark){
			$('button[data-reactid=".0.4.4.0.0.2"]').click();
			nextPage();
			setTimeout(openMarkOrdersPage,500);
		}
	}

	chrome.storage.local.get("staus",function(result){
		if(result.staus == "get_order_id"){
			// getOrderIDs();
		}else if(result.staus == "fill_orders"){
			fillOrders();
		}else if(result.staus == "start_mark_orders"){
			window.selected_orders = {};
			chrome.storage.local.get("orders",function(result){
				var orders = result.orders;
				for(var i = 0;i<orders.length;i++){
					var order = orders[i];
					if(order.selected){
						window.selected_orders[order.id] = order;
					}
				}
			});
			window.checkMarkOrderFlag = setInterval(function(){
				if($("div.trade-order-main").length>0){
					chrome.storage.local.set({staus:"mark_orders"},function(){
						openMarkOrdersPage();
						clearInterval(window.checkMarkOrderFlag);
					});
				}
			},500);
		}
	});
});