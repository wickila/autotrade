/*
 * 出现在淘宝的"已卖出宝贝"页面中。主要用来与插件通讯,返回订单给插件
 * */
$(function () {
    /**
     * 获取url中的参数
     * */
    function getUrlParam(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
        var r = window.location.search.substr(1).match(reg);  //匹配目标参数
        if (r != null) return unescape(r[2]);
        return null; //返回参数值
    }

    /*
     * 获取当前页面的订单信息
     * */
    window.getCurrentOrderIds = function (markStyle) {
        var orders = [];//本页订单
        window.mark_style = markStyle;
        //遍历本页面中每条订单div
        $("div.trade-order-main").each(function () {
            var order_div = $(this);
            var trade_btn = order_div.find("a.button-mod__button___2EmeL");//发货按钮
            var ms = order_div.find("#flag").find("i").attr("style");
            var mark_style_match = false;
            for (var i = 0; i < window.mark_style.length; i++) {
                if (ms.indexOf(window.mark_style[i]) > -1) {
                    mark_style_match = true;
                    break;
                }
            }
            if (trade_btn.length > 0 && order_div.find("a#viewFxOrder").length == 0 && mark_style_match) {
                //有发货按钮&&没有"查看采购单"按钮&&标记符合要求
                var id = order_div.data("reactid").split("$")[1];
                var buyer = order_div.find("a.buyer-mod__name___S9vit").text();
                var time = order_div.find('span[data-reactid=".0.4.3:$' + id + '.0.1.0.0.0.6"]').text();
                var flag = order_div.find('#flag').parent().html();
                flag = flag.replace('href="', 'href="https://trade.taobao.com');
                flag = flag.replace('url(//img', 'url(https://img');

                var items = [];
                order_div.find(".suborder-mod__item___dY2q5").each(function () {
                    var item_div = $(this);
                    // 商品商家编号
                    var product_id = item_div.find('span[data-reactid=".0.4.3:$' + id + '.1.1.$0.$0.0.1.3:$0.1"]').text();
                    var name = item_div.find('span[data-reactid=".0.4.3:$' + id + '.1.1.$0.$0.0.1.0.0.1"]').text();
                    var color = item_div.find('span[data-reactid=".0.4.3:$' + id + '.1.1.$0.$0.0.1.1.$0.2"]').text();
                    var price = item_div.find('span[data-reactid=".0.4.3:$' + id + '.1.1.$0.$1.0.1.1"]').text();
                    var count = item_div.find('p[data-reactid=".0.4.3:$' + id + '.1.1.$0.$2.0.0"]').text();
                    var ship = item_div.find('span.text-mod__link___36nmM').text();//发货状态
                    var img_div = order_div.find('img[data-reactid=".0.4.3:$' + id + '.1.1.$0.$0.0.0.0.0"]');
                    var detail_div = order_div.find('a[data-reactid=".0.4.3:$' + id + '.1.1.$0.$5.0.1.$0.0"]');
                    var thumb = "https://" + img_div.attr("src");
                    var url = "https://" + detail_div.attr("href");
                    var item = {
                        "product_id": product_id,
                        "name": name,
                        "color": color,
                        "price": price,
                        "count": count,
                        "ship": ship,
                        "thumb": thumb,
                        "url": url
                    }
                    items.push(item);
                });

                orders.push({
                    id: id,
                    buyer: buyer,
                    time: time,
                    flag: flag,
                    items: items,
                    selected: false
                });
            }
        });
        return orders;
    }
    /*
     * 跳转到下一页
     * */
    window.nextPage = function () {
        var link = $("li.pagination-next").click();
    }
    /**
     * 与插件通信,收到插件发送的消息,进行相应的处理以后,返回给插件
     * */
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
        if (msg.text) {
            if (msg.text == "get_orders") {//获取订单
                var markStyle = msg.markStyle;//包含的标记类型
                var times = msg.times;
                if (times == 0 && !$(".pagination-prev").hasClass("pagination-disabled")) {
                    //如果第一次获取订单时,不在第一页订单页面,则提示刷新,跳转到第一页订单
                    if (confirm("使用小公举统计订单前，需要刷新本页面，是否刷新？")) {
                        location.reload();
                    }
                } else {
                    var result = getOrderIDs(markStyle);
                    var hasNext = !$("li.pagination-next").hasClass("pagination-disabled");//是否还有下一页
                    sendResponse({orders: result, hasNext: hasNext});
                    if (hasNext) {
                        nextPage();
                    }
                }
            } else if (msg.text == "get_mark_by_id") {//通过订单号获取订单标记信息
                $.ajax({
                    url: "https://trade.taobao.com/trade/json/memoInfo.htm?user_type=seller&_input_charset=utf-8&orderid=" + msg.id,
                    type: 'get',
                    dataType: 'json',
                    timeout: 3000,
                    cache: false,
                    async: false,
                    complete: function (data) {
                        sendResponse(data)
                    },
                    success: function (data) {
                        console.log(data)
                        var dt = {id: msg.id, tip: data.tip};
                        sendResponse(dt);
                    }
                });
            }
        }
    });
    /*
     * 获取当前页面的订单
     * */
    window.getOrderIDs = function (markStyle) {
        var its = getCurrentOrderIds(markStyle);
        chrome.storage.local.get("orders", function (result) {//将订单存到本地存储中
            if (its.length > 0) {
                var orders = result == undefined || result.orders == undefined ? [] : result.orders;
                for (var i = 0; i < its.length; i++) {
                    orders.push(its[i]);
                }
                chrome.storage.local.set({orders: orders});
            }
        });
        return its;
    }
    /*
     * 在分销后台中,将用户选择的订单自动填充到表单中等待确认下单
     * */
    window.fillOrders = function () {
        chrome.storage.local.get("orders", function (result) {
            var orders = result.orders == undefined ? [] : result.orders;
            var selected_orders = [];//用户选择的订单
            for (var i = 0; i < orders.length; i++) {
                var order = orders[i];
                if (order.selected) {
                    selected_orders.push(order);
                }
            }
            var txt = "";
            var fillIndex = parseInt(getUrlParam("fill_index"));
            var loopend = selected_orders.length > fillIndex + 20 ? fillIndex + 20 : selected_orders.length;//每次最多20条订单
            for (var i = fillIndex; i < loopend; i++) {
                var order = selected_orders[i];
                txt += order.id + "\n";
            }
            $("textarea.tb-input-hint").val(txt);
            setTimeout(function () {
                chrome.storage.local.set({staus: "fill-orders-complete"});
            }, 2000);
        });
    }
    /*
     * 选中需要标记的订单后批量标记订单
     * */
    window.openMarkOrdersPage = function () {
        window.hasSomeOrderToMark = false;//本页是否有订单需要标记
        $("div.trade-order-main").each(function () {//遍历每个订单div
            var order_div = $(this);
            var id = order_div.data("reactid").split("$")[1];
            if (window.selected_orders[id] != undefined) {//这条订单被用户选中了
                order_div.find("input").click();//选中这条订单
                window.hasSomeOrderToMark = true;
            }
        });
        if (window.hasSomeOrderToMark) {
            $('button[data-reactid=".0.4.4.0.0.2"]').click();//点击批量标记按钮
            nextPage();
            setTimeout(openMarkOrdersPage, 1000);
        }
    }

    /*
     * 获取插件当前的状态,并且做对应的处理
     * */
    chrome.storage.local.get("staus", function (result) {
        if (result.staus == "get_order_id") {
            // getOrderIDs();
        } else if (result.staus == "fill_orders") {//下单
            fillOrders();
        } else if (result.staus == "start_mark_orders") {//开始标记订单
            window.selected_orders = {};//筛选用户选中的订单
            chrome.storage.local.get("orders", function (result) {
                var orders = result.orders;
                for (var i = 0; i < orders.length; i++) {
                    var order = orders[i];
                    if (order.selected) {
                        window.selected_orders[order.id] = order;
                    }
                }
            });
            window.checkMarkOrderFlag = setInterval(function () {
                if ($("div.trade-order-main").length > 0) {//如果订单页面加载出来了, 就开始标记订单
                    chrome.storage.local.set({staus: "mark_orders"}, function () {
                        openMarkOrdersPage();
                        clearInterval(window.checkMarkOrderFlag);
                    });
                }
            }, 500);
        }
    });
});