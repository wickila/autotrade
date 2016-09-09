$(function(){
	window.gotoTradePage = function(){
		window.selected_orders = [];
		chrome.storage.local.get("orders",function(result){
			var orders = result.orders;
			for(var i = 0;i<orders.length;i++){
				var order = orders[i];
				if(order.selected){
					window.selected_orders.push(order);
				}
			}
		});
		chrome.storage.local.set({staus:"fill_orders"},function(){
			var url = "https://gongxiao.tmall.com/distributor/order/unrelated_fast_create_order.htm?spm=a1z0g.6.0.0.3ppSf1";
			for(var i=0;i<window.selected_orders.length;i+=20){
				window.open(url+"&fill_index="+(i),"_blank");
			}
		});
	}
});