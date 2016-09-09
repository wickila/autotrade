$(function(){
	chrome.storage.local.get("staus",function(result){
		if(result.staus == "mark_orders"){
			setTimeout(function(){
				$("#flag4").click();
				$("#memo").val("已采购@by auto mark");
				$("#memo").focus();
			},1);
		}
	});
});