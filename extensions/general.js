/**
 * 通用脚本,每个页面中都有的。
 * **/
$(function () {
    /*
     * 跳转到淘宝供销平台的下单页面
     * */
    window.gotoTradePage = function () {
        window.selected_orders = [];
        chrome.storage.local.get("orders", function (result) {
            var orders = result.orders;
            for (var i = 0; i < orders.length; i++) {
                var order = orders[i];
                if (order.selected) {
                    window.selected_orders.push(order);
                }
            }
        });
        chrome.storage.local.set({staus: "fill_orders"}, function () {
            var url = "https://gongxiao.tmall.com/distributor/order/unrelated_fast_create_order.htm?spm=a1z0g.6.0.0.3ppSf1";
            for (var i = 0; i < window.selected_orders.length; i += 20) {
                window.open(url + "&fill_index=" + (i), "_blank");
            }
        });
    }
    /*
     * 跳转到已卖出宝贝页面,准备标记订单
     * */
    window.markOrders = function () {
        chrome.storage.local.set({staus: "start_mark_orders"}, function () {
            var url = "https://trade.taobao.com/trade/itemlist/list_sold_items.htm";
            window.open(url, "_self");
        });
    }
});