/*
* 出现在淘宝的"编辑标记"页面中。用于自动标记订单
* */
$(function () {
    chrome.storage.local.get("staus", function (result) {
        if (result.staus == "mark_orders") {
            setTimeout(function () {
                $("#flag4").click();
                $("#memo").val("已采购@by auto mark");
                $("#memo").focus();
            }, 1);
        }
    });
});