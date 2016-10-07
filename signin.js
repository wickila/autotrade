/**
 * Created by wicki on 16/9/14.
 */
$(function () {
    $("#signin-form").attr("action", window.autohub_host + $("#signin-form").attr("action"))
    $("#submit-btn").click(function () {
        console.log("click")
        $("#signin-form").ajaxForm({
            success: function (data) {
                if (data.result) {
                    console.log(data.username);
                    window.location = "popup.html";
                }else{
                    $("#helpblock").show();
                    $("#helpblock").text(data.message);
                }
            }
        }).submit();
    })
});
