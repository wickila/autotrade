String.format = function (src) {
    if (arguments.length == 0) return null;
    var args = Array.prototype.slice.call(arguments, 1);
    return src.replace(/\{(\d+)\}/g, function (m, i) {
        return args[i];
    });
};

$(function () {
    /**
     * 插入订单信息单元格
     * */
    function insert_order_cell(order, index) {
        // var tableCell = "<tr id='{0}''>" +
        //     "<th width='30px' align='center'>&nbsp;&nbsp;" + (index < 10 ? "0" + index : index) + "</th>" +
        //     "<td width='20px' align='center'><input class='selecter' data-id='{1}' type='checkbox'></td>" +
        //     "<td width='36px'><img class='thumb' src='{2}'/></td>" +
        //     "<td width='150px' align='center'><a href='{3}' target='_blank'>{4}</a></td>" +
        //     "<td width='90px'>{5}</td>" +
        //     "<td width='150px' class='small'>{6}</td>" +
        //     "<td width='80px' align='center'>{7}</td>" +
        //     "<td class='small'>{8}</td></tr>";
        // var tr = $("#order-details").append(String.format(tableCell,
        //     order.id,
        //     order.id,
        //     order.thumb,
        //     order.url, order.id,
        //     order.buyer,
        //     order.time,
        //     order.flag,
        //     order.name));
        var orderCell = "<th align='center' rowspan='{9}'>" + (index < 10 ? "0" + index : index) + "</th>" +
            "<td align='center' rowspan='{9}'><input class='selecter' data-id='{1}' type='checkbox'></td>" +
            "<td width='40px' align='center'>{10}</td>" +
            "<td align='center' rowspan='{9}'><a href='{3}' target='_blank'>{4}</a></td>" +//订单编号
            "<td rowspan='{9}'>{5}</td>" +//买家
            "<td class='small' rowspan='{9}'>{6}</td>";//时间
        var itemCell = "<td width='50px'><img class='thumb' src='{2}'/></td>" +//缩略图
            "<td width='200px' class='small'>{8}</td>" +//商品名称
            "<td width='40px' align='center'>{7}</td>";
        var tableCell = "<tr id='{0}''>" +
            orderCell +
            itemCell +
            "</tr>";//数量
        var tr = $("#order-details").append(String.format(tableCell,
            order.id,
            order.id, order.items[0].thumb,
            order.items[0].url, order.id, order.buyer,
            order.time, order.items[0].count, order.items[0].name,
            order.items.length,
            order.flag));
        for (var i = 1; i < order.items.length; i++) {
            var item = order.items[i];
            $("#order-details").append(String.format("<tr id='{0}''>" + itemCell + "</tr>", order.id, order.id, item.thumb,
                item.url, order.id, order.buyer,
                order.time, item.count, item.name,
                0));
        }
        $("#place-holder").remove();
        var cell = $("#order-details").find('input[data-id="' + order.id + '"]');
        if (order.selected == true) {
            cell.attr("checked", "checked");
        } else {
            cell.attr("checked", false);
        }
        cell.click(function () {
            window.current_order_id = $(this).attr("data-id");
            window.current_roder_selected = $(this).is(':checked');
            chrome.storage.local.get("orders", function (result) {
                var orders = result.orders;
                for (var i = 0; i < orders.length; i++) {
                    var order = orders[i];
                    if (order.id == window.current_order_id) {
                        order.selected = window.current_roder_selected;
                        break;
                    }
                }
                chrome.storage.local.set({orders: result.orders});
            });
        });
        //鼠标划过获取订单旗帜标记信息
        $("#order-details").find("#" + order.id).find("#flag").mouseover(function () {
            if ($(this).attr("title") == '编辑标记信息，仅自己可见') {
                var id = $(this).data("reactid").replace(".0.4.3:$", '').replace(".0.1.0.1.0.$0.0", '');
                chrome.tabs.getSelected(null, function (tab) {
                    chrome.tabs.sendMessage(tab.id, {
                        text: "get_mark_by_id", id: id
                    }, function (result1) {
                        console.log(result1);
                        $("#order-details").find("#" + result1.id).find("#flag").attr("title", result1.tip);
                    });
                });
            }
        })
    };

    function showTip(message) {
        $("#message").text(message).show().fadeOut(2000);
    }

    /*
     * 初始化页面,检查已经获取到未发货订单。如果有,则显示订单,没有则显示获取订单界面
     * **/
    chrome.storage.local.get("orders", function (result) {
        if (result.orders != undefined) {
            $(".has-no-orders-show").hide();
            $(".has-orders-show").show();
            $(".operate-area").show();
            var orders = result.orders;
            window.all_selected = true;
            for (var i = 0; i < orders.length; i++) {
                var order = orders[i];
                window.all_selected &= order.selected;
                insert_order_cell(order, i + 1);
            }
            if (window.all_selected) {
                $("#all-select").attr("checked", "checked");
            }
        } else {
            chrome.tabs.getSelected(null, function (tab) {
                if (tab.url.indexOf('trade.taobao.com/trade/itemlist/list_sold_items.htm') < 0) {
                    $("#getOrdersBtn").attr("disabled", "disabled");
                    $("#alert-to-order-page").removeClass("hide");
                }
            });
        }
    });

    /*
     * 获取最近的未发货订单
     * **/
    $('#getOrdersBtn').click(function (event) {
        $(".has-no-orders-show").hide();
        $(".progress").fadeIn();
        $(".has-orders-show").fadeIn();
        window.insert_order_cell_index = 1;
        chrome.storage.local.clear();
        window.get_orders_times = 0;
        window.load_order_interval = setInterval(function () {
            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    text: "get_orders",
                    times: window.get_orders_times++,
                    markStyle: $("#mark-selecter").val()
                }, function (result) {
                    if (result) {
                        var hasNext = result.hasNext;
                        var orders = result.orders;
                        if (orders.length > 0) {
                            for (var i = 0; i < orders.length; i++) {
                                var order = orders[i];
                                insert_order_cell(order, window.insert_order_cell_index++);
                            }
                        }
                        if (orders.length == 0 || !hasNext) {
                            $(".progress").fadeOut(function () {
                                $(".operate-area").show();
                            });
                            chrome.storage.local.set({staus: "get_orders_complete"});
                            clearInterval(window.load_order_interval);
                        }
                    } else {
                        chrome.tabs.executeScript(null, {code: "alert('出现了点小意外,请刷新淘宝页面再尝试一下:)');"});
                    }
                });
            });
        }, 1000);
        // chrome.storage.local.set({staus:"get_order_id"});
        // chrome.tabs.executeScript(null,{code:"getOrderIDs();"});
    });

    function exec_if_has_orders(func) {
        chrome.storage.local.get("orders", function (result) {
            var orders = result.orders;
            var has_order = false;
            for (var i = 0; i < orders.length; i++) {
                var order = orders[i];
                if (order.selected) {
                    has_order = true;
                    break;
                }
            }
            if (has_order) {
                func();
            } else {
                showTip("请至少选择一个订单");
            }
        });
    }

    /*
     * 开始下单
     * **/
    $("#fillOrderBtn").click(function () {
        exec_if_has_orders(function () {
            chrome.storage.local.set({staus: "fill_orders"});
            chrome.tabs.executeScript(null, {code: "gotoTradePage();"});
        });
    });

    /*
     * 开始标记订单
     * **/
    $("#markBtn").click(function () {
        exec_if_has_orders(function () {
            chrome.tabs.executeScript(null, {code: "markOrders();"});
        });
    });

    /*
     * 重置工具
     * */
    $("#resetBtn").click(function () {
        chrome.storage.local.clear();
        window.close();
    });

    $("#all-select").click(function () {
        window.all_selected = $(this).is(':checked');
        $(".selecter").each(function () {
            if ($(this).is(':checked') != window.all_selected) {
                $(this).click();
            }
        })
        chrome.storage.local.get("orders", function (result) {
            var orders = result.orders;
            for (var i = 0; i < orders.length; i++) {
                var order = orders[i];
                order.selected = window.all_selected;
            }
            chrome.storage.local.set({orders: result.orders});
        });
    });


    $.ajax({
        url: window.autohub_host + "/api/user/signed",
        method: "POST",
        success: function (data) {
            if (data.result) {
                window.user = data.user;
                chrome.storage.local.set({"user": data.user}, function () {
                    $(".signin").hide();
                    $(".signout").show();
                    $("#username").text(data.user.username);
                });
            }
        }
    });

    $("#signout-btn").click(function () {
        $.ajax({
            url: window.autohub_host + "/api/user/signout",
            method: "POST",
            success: function (data) {
                if (data.result) {
                    window.user = null;
                    chrome.storage.local.set({"user": null}, function () {
                        $(".signin").show();
                        $(".signout").hide();
                        $("#username").text("");
                    });
                }
            }
        });
    });

    $("#help-btn").click(function () {
        var h = $("#help-content").css("display") == "none" ? "340px" : "450px";
        $("#order-details").parent().animate({height: h});
        $("#help-content").slideToggle();
        $(this).toggleClass("active", !$(this).hasClass("active"));
    });
});