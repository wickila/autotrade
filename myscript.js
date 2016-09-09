$(function(){
	// alert("mysqcript");

	window.getCurrentOrderIds = function(markStyle){
		var items = [];
		window.mark_style = markStyle;
		$("div.trade-order-main").each(function(){
			var order_div = $(this);
			var trade_btn = order_div.find("a.button-mod__button___2EmeL");
			var ms = order_div.find("#flag").find("i").attr("style");
			var mark_style_match = false;
			for(var i=0;i<window.mark_style.length;i++){
				if(ms.indexOf(window.mark_style[i])>-1){
					mark_style_match = true;
					break;
				}
			}
			if(trade_btn.length>0 && order_div.find("a#viewFxOrder").length==0 && mark_style_match){
				var id = order_div.data("reactid").split("$")[1];
				var buyer = order_div.find("a.buyer-mod__name___S9vit").text();
				var time = order_div.find('span[data-reactid=".0.4.3:$'+id+'.0.1.0.0.0.6"]').text();
				var img_div = order_div.find('img[data-reactid=".0.4.3:$'+id+'.1.1.$0.$0.0.0.0.0"]');
				var detail_div = order_div.find('a[data-reactid=".0.4.3:$'+id+'.1.1.$0.$5.0.1.$0.0"]');
				var thumb = "https://"+img_div.attr("src");
				var url = "https://"+detail_div.attr("href");
				var flag = order_div.find('#flag').parent().html();
				flag = flag.replace('href="','href="https://trade.taobao.com');
				flag = flag.replace('url(//img','url(https://img');
				items.push({id:id,
							buyer:buyer,
							time:time,
							thumb:thumb,
							url:url,
							flag:flag,
							name:order_div.find('span[data-reactid=".0.4.3:$'+id+'.1.1.$0.$0.0.1.0.0.1"]').text(),
							selected:false});
			}
		});
		return items;
	}

	window.nextPage = function(){
		var link = $("li.pagination-next").click();
	}
});