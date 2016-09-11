// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
debugger;

String.format = function(src){  
    if (arguments.length == 0) return null;  
    var args = Array.prototype.slice.call(arguments, 1);  
    return src.replace(/\{(\d+)\}/g, function(m, i){  
        return args[i];  
    });  
}; 

document.addEventListener('DOMContentLoaded', function() {
  window.insert_order_cell = function(order,index){
    var tableCell = "<tr id='{0}''>"+
                    "<th width='30px' align='center'>&nbsp;&nbsp;"+(index<10?"0"+index:index)+"</th>"+
                    "<td width='20px' align='center'><input class='selecter' data-id='{1}' type='checkbox'></td>"+
                    "<td width='36px'><img class='thumb' src='{2}'/></td>"+
                    "<td width='150px' align='center'><a href='{3}' target='_blank'>{4}</a></td>"+
                    "<td width='90px'>{5}</td>"+
                    "<td width='150px' class='small'>{6}</td>"+
                    "<td width='80px' align='center'>{7}</td>"+
                    "<td class='small'>{8}</td></tr>";
    var tr = $("#order-details").append(String.format(tableCell,order.id, order.id, order.thumb, order.url, order.id, order.buyer, order.time, order.flag, order.name));
    $("#place-holder").remove();
    var cell = $("#order-details").find('input[data-id="'+order.id+'"]');
    if(order.selected==true){
      cell.attr("checked","checked")
    }else{
      cell.attr("checked",false)
    }
    cell.click(function(){
      window.current_order_id = $(this).attr("data-id");
      window.current_roder_selected = $(this).is(':checked');
      chrome.storage.local.get("orders", function(result) {
        var orders = result.orders;
        for (var i = 0; i < orders.length; i++) {
          var order = orders[i];
          if(order.id == window.current_order_id){
            order.selected = window.current_roder_selected;
            break;
          }
        }
        chrome.storage.local.set({orders:result.orders});
      });
    });

    $("#order-details").find("#"+order.id).find("#flag").mouseover(function(){
      if($(this).attr("title")=='编辑标记信息，仅自己可见'){
        var id = $(this).data("reactid").replace(".0.4.3:$",'').replace(".0.1.0.1.0.$0.0",'');
        chrome.tabs.getSelected(null, function(tab) {
          chrome.tabs.sendMessage(tab.id, {
            text: "get_mark_by_id",id:id
          }, function(result1) {
            console.log(result1);
            $("#order-details").find("#"+result1.id).find("#flag").attr("title",result1.tip);
          });
        });
      }
    })
  };

  chrome.storage.local.get("orders",function(result){
    if(result.orders != undefined){
      $(".has-no-orders-show").hide();
      $(".has-orders-show").show();
      $(".operate-area").show();
      var orders = result.orders;
      window.all_selected = true;
      for (var i = 0; i < orders.length; i++) {
        var order = orders[i];
        window.all_selected &= order.selected;
        insert_order_cell(order,i+1);
      }
      if(window.all_selected){
        $("#all-select").attr("checked","checked");
      }
    }else{
      chrome.tabs.getSelected(null, function(tab) {
        if(tab.url.indexOf('trade.taobao.com/trade/itemlist/list_sold_items.htm')<0){
          $("#getOrdersBtn").attr("disabled","disabled");
          $("#alert-to-order-page").removeClass("hide");
        }
      });
    }
  });

  $('#getOrdersBtn').click(function(event) {
    $(".has-no-orders-show").hide();
    $(".progress").fadeIn();
    $(".has-orders-show").fadeIn();
    window.insert_order_cell_index = 1;
    chrome.storage.local.clear();
    window.get_orders_times = 0;
    window.load_order_interval = setInterval(function() {
      chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendMessage(tab.id, {
          text: "get_orders",
          times: window.get_orders_times++,
          markStyle: $("#mark-selecter").val()
        }, function(result) {
          if(result){
            var hasNext = result.hasNext;
            var orders = result.orders;
            if (orders.length>0) {
              for (var i = 0; i < orders.length; i++) {
                var order = orders[i];
                insert_order_cell(order,window.insert_order_cell_index++);
              }
            }
            if(orders.length==0 || !hasNext) {
              $(".progress").fadeOut(function(){
                $(".operate-area").show();
              });
              chrome.storage.local.set({staus:"get_orders_complete"});
              clearInterval(window.load_order_interval);
            }
          }else{
            chrome.tabs.executeScript(null,{code:"alert('出现了点小意外,请刷新淘宝页面再尝试一下:)');"});
          }
        });
      });
    }, 1000);
    // chrome.storage.local.set({staus:"get_order_id"});
    // chrome.tabs.executeScript(null,{code:"getOrderIDs();"});
  });

  $("#fillOrderBtn").click(function() {
    chrome.storage.local.set({staus:"fill_orders"});
    chrome.tabs.executeScript(null,{code:"gotoTradePage();"});
  });

  $("#markBtn").click(function(){
    chrome.tabs.executeScript(null,{code:"markOrders();"});
  });

  $("#resetBtn").click(function(){
    chrome.storage.local.clear();
    window.close();
  });

  $("#all-select").click(function(){
    window.all_selected = $(this).is(':checked');
    $(".selecter").each(function(){
      if($(this).is(':checked')!=window.all_selected){
        $(this).click();
      }
    })
    chrome.storage.local.get("orders", function(result) {
      var orders = result.orders;
      for (var i = 0; i < orders.length; i++) {
        var order = orders[i];
        order.selected = window.all_selected;
      }
      chrome.storage.local.set({orders:result.orders});
    });
  })
});