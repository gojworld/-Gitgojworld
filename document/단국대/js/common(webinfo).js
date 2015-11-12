var contextMap = new Map();
contextMap.put("rein", {server:"/rein",local:"/ngis-research"});
contextMap.put("tiac", {server:"/tiac",local:"/ngis-university"});
contextMap.put("tiad", {server:"/tiad",local:"/ngis-administration"});
contextMap.put("tiaf", {server:"/tiaf",local:"/ngis-adjunction"});
contextMap.put("ptfo", {server:"/ptfo",local:"/ngis-portfolio"});
contextMap.put("tisc", {server:"/ptfo",local:"/ngis-scheduler"});
contextMap.put("ticm", {server:"",local:"/ngis-common"});
contextMap.put("ngis-examples", {server:"/ngis-examples",local:"/ngis-examples"});

var isLocal = false;
var contextPath = "";
function setLocal(local,contextPath) {
  this.isLocal = (local == "local") ? true : false;
  this.contextPath = contextPath;
  //setRptServiceUrl(local);
}

$(document).ready(function() {
    // 2015.04.07 KJS 뒤로가기 및 새로고침 불가능하도록 변경.
    $("body").on("keydown", function (e) {
        var key = (e) ? e.keyCode : event.keyCode;

        // 백스페이스
        if (key == 8) { // backspace
            var tags = /INPUT|SELECT|TEXTAREA/i;
            var inputType = /text|password/i;
            if (!tags.test(e.target.tagName) || !inputType.test(e.target.type) || e.target.disabled || e.target.readOnly) {
                e.preventDefault();
            }
        }

        // 새로고침
        if(!isLocal && key == 116) { // F5
            e.preventDefault();
        }
    });

    //마우스 우클릭 방지.
    //$("body").attr("oncontextmenu","return false");

    $("form[data-role=search]").submit(function () {
        $(this).initPagination();
    });
/*
    $(".datepicker").datepicker({
        dateFormat:"yy-mm-dd",
        showMonthAfterYear:true,
        autoSize:true,
        changeYear:true,
        changeMonth:true,
        yearRange:"c-80:c+2",
        showAnim:""
    });

    $(".btn_datepicker").click(function(e){
      e.preventDefault();
        $(this).prev(".datepicker").datepicker("show");
    });
*/
    // button의 event를 권한 및 enabled에 따라 제어한다.
    $(".btn_txt").click(function (e) {
      if ($(this).parent("a").data("userauth") == false
        || $(this).parent("a").data("enabled") == false) {
        e.preventDefault();	// event bubble 제어
        e.stopPropagation();
        return false;
      }
    });

    $("a").click(function (e) {
        var $a = $(this);

        // 사진등록/변경 버튼과 file tag의 크기가 달라 file tag가 click되지 않고 anchor가 click됨.
        // anchor가 click되면 화면이동을 막고 file tag가 click되도록 변경
        if ($a.hasClass("btn_photo_add")) {
            e.preventDefault();
            $a.siblings(".fake_file").trigger("click");
        }

        if ($a.data("method") == "post") {
            e.preventDefault();

            var querystring = this.search;
            if (querystring.indexOf("?") > -1) {
                querystring = querystring.substring(1);
                var params = querystring.split("&");
                var elements = "";
                var nameValuePair;
                var value;

                $.each(params, function(index, param) {
                    nameValuePair = param.split("=");
                    value = (nameValuePair[1] == undefined) ? "" : nameValuePair[1];
                    elements += "<input type='hidden' name='" + nameValuePair[0] + "' value='" + value + "'>";
                });

                // IE9 에서는 base tag가 정상적인 작동을하지 못 해 현재의 context path를 얻어 context path 잘라내야 함.
                // 또한 IE9 에서는 this.pathname의 값에 / 포함되있지 않음(Chrome에선 / 로 시작 e.g. IE9: ngis-examples/emp.. Chrome: /ngis-examples/emp..)
                var pathname;
                if ($a.data("context")) {
                  pathname = convertContext($a.data("context")) + "/" + this.pathname.substring($.contextPath().length);
                } else {
                    pathname = this.pathname.substring($.contextPath().length);
                }
                pathname = pathname.match("^/") ? pathname.substring(1) : pathname;
                $("<form method='post' action='" + pathname + "'>" + elements + "</form>").appendTo("body").submit().remove();
            }
        }

        if ($a.data("context")) {
            $a.attr("href", convertContext($a.data("context")) + "/" + $a.attr("href"));
        }
    });

    // table의 N번째 컬럼의 checkbox를 찾아 전체선택/해제 한다.
    $("table > thead > tr > th").on("click", ".check_all", function (e) {
      var $parents = $(this).parents("table"); // 선택된 checkbox의 table
      var chkIndex = ($(this).parents("th").index()+1); // 선택된 checkbox의 index
        var checked  = $(this).prop("checked"); // check여부

        $parents.find("tbody > tr >td:nth-child("+chkIndex+")").find(":checkbox").prop("checked",checked); // tbody의 선택된 index에 해당하는 checkobx 를 check여부에 따라 셋팅
    });

    // table의 N번째 컬럼의 checkbox를 찾아 전체선택/해제 한다. (scroll grid 전용)
    $("table > thead > tr > th").on("click", ".check_all_scroll", function (e) {
      var $parents = $(this).parents("table"); // 선택된 checkbox의 table
      var $table   = $parents.siblings().children();
      var chkIndex = ($(this).parents("th").index()+1); // 선택된 checkbox의 index
        var checked  = $(this).prop("checked"); // check여부

        $table.find("tbody > tr >td:nth-child("+chkIndex+")").find(":checkbox").prop("checked",checked);
        // tbody의 선택된 index에 해당하는 checkobx 를 check여부에 따라 셋팅

    });

});



$.contextPath = function () {
    //var offset = location.href.indexOf(location.host) + location.host.length;
    //return location.href.substring(offset, location.href.indexOf('/', offset + 1));
    // javascript 상에서 contextpath를 구하는데 어려움이 있어 server에서 던져준 contextPath를 사용하도록 변경.
    return contextPath;
};

$.fn.initPagination = function (prefix) {
    if(!$("input[name$=currentPageNo]").length) {
        if (prefix == "undefined" || $.trim(prefix).length == 0) {
            prefix = "pagination";
        }
        var $input = $("<input>", {type: "hidden", name: prefix + ".currentPageNo", value: "1"});
        $input.appendTo(this);
    }
};

//openWindow
$.openWindow = function (options) {
    if (options.width == undefined || options.width == "") {
        options.width = 1024;
    }
    if (options.height == undefined || options.height == "") {
        options.height = 768;
    }
    if (options.layout == undefined || options.layout == "") {
        options.layout = "resizable=no, toolbar=no, menubar=no, location=no, status=no, scrollbars=yes";
    }
    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;
    var screenWidth = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    var screenHeight = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
    var left = (screenWidth / 2) - (options.width / 2) + dualScreenLeft;
    var top = (screenHeight / 2) - (options.height / 2) + dualScreenTop;
    var popupWindowName = "__COMMON_WINDOW__" + Math.floor((Math.random() * 10000000000000000) + 1);
    var url = options.context != undefined ? convertContext(options.context) + "/" + options.url : options.url;

    var elements = "";
    if ($.isArray(options.params)) {
        $.each(options.params, function(index, params) {
          elements += "<input type='hidden' name='" + params.name + "' value='" + params.value + "'>";
        });
    } else {
        if (options.params != undefined && options.params != null) {
            $.each(options.params, function(name, value) {
                elements += "<input type='hidden' name='" + name + "' value='" + value + "'>";
            });
        }
    }

    var $form = $("<form method='post' action='" + url + "' target='" + popupWindowName + "'>" + elements + "</form>").appendTo("body");
    var w = window.open("", popupWindowName, "top=" + top + ", left=" + left + ", width=" + options.width + ", height=" + options.height + ", " + options.layout);
    $form.submit().remove();
    return w;
};

//openLayerPopup
/**
 * @desc      : layer popup을 뛰운다.
 * @comment   :
 * @param     : options - templateId : layer popup layout
 *                      - title      : popup 제목
 *                      - callback   : popup이 닫힌후 callback처리 함수
 *                      - width      : popup의 가로 크기 (default - 450)
 *                      - modal      : modal 여부 (default - true)
 * @create    : 2014.10.02
 * @author    : jsKim
 */
$.openLayerPopup = function (options) {
    if (!options) {
        alert("parameter가 없습니다.");
        return false;
    }

    var layerObj = $("<div>", {id: "__layer_popup__"}).append($("<h2>", {"class": "tit_pop", text: options.title })).appendTo("body").dialog({
        //이벤트 발생했을때 보여주려면 autoOpen : false로 지정해줘야 한다.
        autoOpen: false,
        //레이어팝업 넓이
        width: options.width || 450,
        height: options.height || undefined,
        //뒷배경을 disable 시키고싶다면 true
        modal: options.modal || true,
        close: function( event, ui ) {
            $(this).remove();
        },
        //버튼종류
        buttons: [
            {
                //버튼텍스트
                text: "확인",
                'class':'btn_pop_save',

                //클릭이벤트발생시 동작
                click: function() {
                    if(options.callback){
                        eval(options.callback)();
                    }
                    $(this).dialog("close");
                    $(this).remove();
                }
            }
        ]
    });

    var formatter = $(options.templateId).val();

    $(formatter).appendTo($(layerObj));
    $(layerObj).dialog("open");
    select_design();
};

//addRow
$.fn.addRow = function (templateId, params) {
    $(".empty", this).remove();

    var formatter = $.validator.format($.trim($(templateId).val()));
    var numbering = $("td", formatter([])).hasClass("numbering");
    var rowCount = (numbering) ? $("tbody > tr:last > td.numbering", this).text() : $("tbody > tr", this).length;
    var _params;
    if (numbering) {
        _params = [++rowCount, rowCount - 1];
    } else {
        _params = [rowCount];
    }
    var row = $(formatter((params == undefined) ? _params : _params.concat(params)));
    $(row).appendTo(this);
    select_design();
    file_design();
    datepicker_design();
    return row;
};

//removeRow
$.fn.removeRow = function () {
    $.each(this, function(index, element){
        if ($(element).prop("checked")) {
            if ($(element).parents("tr").find("input[name$=status]").val() == 2) {
                $(element).parents("tr").remove();
            } else {
                $(element).parents("tr").find("input[name$=status]").val(8);
                $(element).parents("tr").css("display", "none");
            }
        }
    });
};

//addEmptyRow
$.fn.addEmptyRow = function(){
    var colspan = $(this).find("th").size();
    $("<tr><td class='ta_c empty' colspan='"+colspan+"''>조회된 내용이 없습니다.</td></tr>").appendTo(this).find("tbody");
};

//enable
/**
 * @desc       : button의 enabled를 권한에 따라 설정한다.
 * @comment    : 버튼권한(userauth)이 false일 경우 무조건 버튼은 disable된다.
 *               버튼권한(userauth)이 true일 경우 사용자가 준 enabled에 따른 버튼의 enabled/disabled  설정한다.
 *               버튼과 앵커 이외는 전달받은 값으로 enabled/disabled 설정하고, form/Div의 하위에 있는 text,textarea,select등 일괄로 enabled/disabled 시킨다.
 * @create    : 2014.10.07
 * @author    : jsKim
 */
$.fn.enable = function (enabled) {
    if ($(this).length == 0) {
        return;
    }
    var tagName = $(this).prop('tagName').toLowerCase();

    switch (tagName) {
        case "a":
        case "button":
            // 버튼의 권한이 false경우 무조건 disable
            if ($(this).data("userauth") == false) {
                $(this).data("enabled",false);
                $(this).attr("disabled","disabled");
            } else {
                $(this).data("enabled",enabled);

                if (enabled) {
                    $(this).removeAttr("disabled");
                } else {
                    $(this).attr("disabled","disabled");
                }
            }
            break;
        case "select":
            $(this).prop('disabled', !enabled).trigger("chosen:updated");
            break;
        case "input": // 달력(datepicker)
            if ($(this).hasClass("datepicker")) {
                if (enabled) {
                    $(this).datepicker('enable');
                } else {
                    $(this).datepicker('disable');
                    $(this).attr("disabled","disabled");
                }
            } else {
                if (enabled) {
                    $(this).removeAttr("disabled");
                } else {
                    $(this).attr("disabled","disabled");
                }
            }
            break;
        case "form":
        case "div":
            var selector = ":text,textarea,:checkbox,:radio"; // select/달력 이외의 elements

            if ($(this).find(".datepicker").length > 0 ) {
                $(this).find(".datepicker").enable(enabled); // 달력(datepicker)
            }

            if ($(this).find("select").length > 0) {
                $(this).find("select").enable(enabled); // select(chosen)
            }

            if (enabled) {
                $(this).find(selector).removeAttr("disabled");
            } else {
                $(this).find(selector).attr("disabled","disabled");
            }
            break;
        default:
            if (enabled) {
                $(this).removeAttr("disabled");
            } else {
                $(this).attr("disabled","disabled");
            }
            break;
    }


};

//seleced
/**
 * @desc      : 해당 값으로 selected 해준다.
 * @param     : val - select 값
 * @author    : jsKim
 */
$.fn.selected = function(val, parentWindow) {
    if (val != undefined && val != null) {
        if (parentWindow) {
            parentWindow.$(this).val(val).trigger("chosen:updated").trigger("change");
        } else {
            $(this).val(val).trigger("chosen:updated");
        }
    }
    return $(this);
};

$.fn.getText = function() {
    return $(this).siblings("div").find(".chosen-single>span").text();
};

/**
 * @desc      : 모든 option을 초기화시킨다.
 * @author    : jsKim
 */
$.fn.remonveOption = function() {
    $(this).find("option").remove();
    $(this).trigger("chosen:updated");
    return $(this);
};

//addOptions
/**
 * @desc      : select tag의 option을 추가해준다.
 * @comment   :
 * @param     : options  - selectedVal : 초기 select의 선택값
 *                       - callback    : select를 생성후 처리할 callback funtion명
 *                       - value       : select의 option의 value
 *                       - text        : select의 option의 text  <option value="1">text</option>
 *                       - dataList    : 조회된 data
 * @create    : 2014.10.16
 * @author    : jsKim
 */
$.fn.addOptions = function(options) {
    $(this).find("option").remove();

    if (!options) {
        alert("parameter가 없습니다.");
        return false;
    }

    var placeholder = $(this).data("placeholder");
    if (placeholder) {
        $(this).append($("<option>", {value: "", text: placeholder}));
    }

    for (var index = 0; index < options.dataList.length; index++) {
        $(this).append($("<option>", {value: options.dataList[index][options.value], text : options.dataList[index][options.text]}));
    }

    if (options.selectedVal) {
        $(this).selected(options.selectedVal);
    } else {
        $(this).trigger("chosen:updated");
    }

    if (options.callback) {
        eval(options.callback)();
    }
};

//close
$.closeWindow = function () {
    if (browser.name == "mozilla") {
        window.open("about:blank", "_self").close();
    } else {
        self.close();
    }
};

//browser detect
var browser = (function() {
    var s = navigator.userAgent.toLowerCase();
    var match = /(chrome)[ \/]([\w.]+)/.exec(s) ||
                /(webkit)[ \/](\w.]+)/.exec(s) ||
                /(opera)(?:.*version)?[ \/](\w.]+)/.exec(s) ||
                /(msie) ([\w.]+)/.exec(s) ||
               !/compatible/.test(s) && /(mozilla)(?:.*? rv:([\w.]+))?/.exec(s) ||
               [];
    return {name: match[1] || "", version: match[2] || "0"};
}());

//submit
/**
 * @desc      : submit을 보낸다.
 * @comment   : 사용자로 부터 받은 url 의 경로로 form을 만들어 submit한다.
 * @param     : url    :
 * @param     : params : json type의 param
 * @create    : 2014.10.22
 * @author    : jsKim
 */
$.submit = function (url,params) {
    if (!url) {
        alert("url은 필수값입니다.");
        return false;
    }

    var elements = "";
    $.each(params,function(key,value){
        elements += "<input type='hidden' name='" + key + "' value='" + value + "'>";
    });

    $("<form method='post' action='" + url + "'>" + elements + "</form>").appendTo("body").submit().remove();
};

//getParam
/**
 * @desc      : param을 가져온다.
 * @comment   : a Tag의 data-param에 있는 json type의 param을 가져온다.
 * @param     :
 * @create    : 2014.10.27
 * @author    : jsKim
 */
$.fn.getParam = function (){
    // http://www.w3schools.com/js/js_json.asp
    return encodeURI(JSON.parse($(this).data("param")));
};

/**
 * 교직원검색
 */
// 2015.04.07 KJS univYn : 학사용 교직원검색(재직/위촉, 교원)
$.fn.staffSearch = function(value,callback,univYn) {
    var $text = $(this);
    var $value = $(value);
    $text.keydown(function (e) {
        var code = e.keyCode || e.which;
        if (code == 13) {
            e.preventDefault();
            if ($text.val() == "") {
                alert("교번 또는 성명을 입력하세요.");
                return;
            }
            $.getJSON("comm/syst/util/popup/findStaffList.do", "empid=" + encodeURI($text.val()) + "&univYn=" + univYn, function (data) {
                if (data.staffList.length == 1) {
                    $text.val(data.staffList[0].empnm);
                    $value.val(data.staffList[0].empid);

                    if (callback) {
                        eval(callback)(data.staffList[0]);
                    }
                } else {
                    $.openWindow({url: "comm/syst/util/popup/findStaffList.do", params: {empid: $text.val(), text: $text.attr("name"), value: $value.attr("name"), callback:callback||"", univYn:univYn||""}});
                }
            });
        } else {
            $value.val("");
        }
    });

    $value.next().click(function (e) {
        e.preventDefault();
        $.openWindow({url: "comm/syst/util/popup/findStaffList.do", params: {empid: $text.val(), text: $text.attr("name"), value: $value.attr("name"), callback:callback||"", univYn:univYn||""}});
    });
};

/**
 * @desc      : 외부사용자 검색팝업
 * @comment   : 외부사용자를 검색한다.
 * @param     :
 * @create    : 2015.04.30
 * @author    : jsKim
 */
$.fn.outsiStaffSearch = function(value,callback) {
    var $text = $(this);
    var $value = $(value);
    $text.keydown(function (e) {
        var code = e.keyCode || e.which;
        if (code == 13) {
            e.preventDefault();
            if ($text.val() == "") {
                alert("교번 또는 성명을 입력하세요.");
                return;
            }
            $.getJSON("comm/syst/util/popup/findOutsiStaffList.do", "empid=" + encodeURI($text.val()), function (data) {
                if (data.staffList.length == 1) {
                    $text.val(data.staffList[0].empnm);
                    $value.val(data.staffList[0].empid);

                    if (callback) {
                        eval(callback)(data.staffList[0]);
                    }
                } else {
                    $.openWindow({url: "comm/syst/util/popup/findOutsiStaffList.do", params: {empid: $text.val(), text: $text.attr("name"), value: $value.attr("name"), callback:callback||""}});
                }
            });
        } else {
            $value.val("");
        }
    });

    $value.next().click(function (e) {
        e.preventDefault();
        $.openWindow({url: "comm/syst/util/popup/findOutsiStaffList.do", params: {empid: $text.val(), text: $text.attr("name"), value: $value.attr("name"), callback:callback||""}});
    });
};

/* ================================================ [S]Report ================================================ */
var permission;
function setPermission(inquiry, registration, print, sms, download) {
    permission = {
        "inquiry": inquiry,
        "registration": registration,
        "print": print,
        "sms": sms,
        "download": download
    };
}

var pageAttribute;
function setPageAttribute(rootMenuId, menuId, programId, programType, personal) {
    pageAttribute = {
        "rootMenuId": rootMenuId,
        "menuId": menuId,
        "programId": programId,
        "programType": programType,
        "personal": personal
    };
}

var reportFile;
var reportOption;
$.cookie.json = true;
$.openReport = function (file, options) {
    // 2015.06.29 IE 8.0이하에서 Report사용이 불가능 하므로 공통으로 제한한다.
    if ($.browser.msie && $.browser.version < 9) {
        alert("IE 8.0 이하버전에서는 사용이 불가능합니다.\nchrome을 설치후 사용하시기 바랍니다.");
        return false;
    }

    setReportOption(file, options);

    if (reportOption.popup) {
        delete reportOption["iframe"];
        $.cookie("reportOption", reportOption, {path: "/"});
        var reportWindow = $.openWindow({url: "comm/syst/util/popup/report.do"});

        // 팝업이 차단되었는지 return값을 이용하여 판별후, 차단되었을 경우 alert
        if (reportWindow == null) {
          alert("차단된 팝업창을 허용해 주십시오.\n" +
                "차단된 팝업창의 허용은 메뉴의 [도구->팝업창 허용] 에서 설정하시기 바랍니다.\n" +
                "툴바가 설치되어 있는경우 툴바를 삭제 하거나 팝업차단기능 해제해 주시기 바랍니다.");
        }
        return;
    }

    if (reportOption.iframe != undefined) {
        $.exportReport();
    }
};

$.exportReport = function (isDownload, file, options) {
    if (options != undefined) {
        setReportOption(file, options);
    }

    if (reportOption == null) {
        alert("생성된 레포트가 없습니다. 먼저 레포트를 출력하십시오.");
        return;
    }

    var $form = $("<form>", {method: "post"});
    $form.append($("<input>", {type: "hidden", name: "file", value: reportOption.file}));
    $form.append($("<input>", {type: "hidden", name: "exportType", value: reportOption.exportType}));
    $form.append($("<input>", {type: "hidden", name: "excelExportSheetOption", value: reportOption.excelExportSheetOption}));

    if (reportOption.params != undefined) {
        $.each(reportOption.params, function(key, value) {
            $form.append($("<input>", {type: "hidden", name: "names", value: key}));
            $form.append($("<input>", {type: "hidden", name: "values", value: value}));
        });
    }

    if (isDownload) {
        if (!$("iframe[name=download]").length) {
            $("<iframe>", {name: "download", style: "display: none"}).appendTo("body");
        }
    }

    $form.attr("target", isDownload ? "download": (reportOption.iframe == undefined) ? "viewer" : reportOption.iframe.name);
    $form.attr("action", isDownload ? "comm/syst/util/report/download.do" : "comm/syst/util/report/viewer.do").appendTo("body").submit().remove();
}

function setReportOption(file,options) {
    if (options == undefined) {
        options = {};
    }

    if (options.iframe == undefined) {
        options.popup = true;
    }

    // option에 reb파일명과 permission,pageAttribute를 추가한다.
    if (!options.hasOwnProperty("file")) {
        options.file = file;
    }
    if (!options.hasOwnProperty("permission")) {
        options.permission = permission;
    }
    if (!options.hasOwnProperty("pageAttribute")) {
        options.pageAttribute = pageAttribute;
    }
    reportOption = options;
}

$(document).ready(function() {
    $("[name=export]").click(function (e) {
        if (reportOption == null) {
            alert("생성된 레포트가 없습니다. 먼저 레포트를 출력하십시오.");
            return;
        }
        reportOption.exportType = (this.id == "excel") ? 3 : 2;
        $.exportReport(true);

        /*
         * ie의 경우 다운로드를 받게 될 경우 리포트 viewr창이 회색으로 변해 리포트 화면이
         * 안 보이는 현상이 있어 리포트 viewer를 다시 한 번 실행.
         */
        if ($.browser.msie) {
            $.exportReport();
        }
    });
});
/* ================================================ [E]Report ================================================ */

$.moveTo = function (url, options) {
    if (options != undefined && options.params != undefined) {
        var elements = "";
        $.each(options.params, function(name, value) {
          elements += "<input type='hidden' name='" + name + "' value='" + value + "'>";
        });
    }

    var $form = $("<form method='post' action='" + url + "'>" + elements + "</form>").appendTo("body");
    $form.submit();
};

/* ================================================ [S]Ajax ================================================ */
/*
$(document).ajaxError(function (evnet, xhr, settings, thrownError) {
    var errorWindow = window.open("", "", "width=800, height=700, resizeable, scrollbars");
    errorWindow.document.write(xhr.responseText);
});
*/
//$(document).ajaxStart(function () {
//    //show ajax indicator
//    ajaxindicatorstart('');
//}).ajaxStop(function () {
//    //hide ajax indicator
//    ajaxindicatorstop();
//});
$.ajaxSetup({
    headers: {"X-Referer": document.URL}
});

/* ================================================ [E]Ajax ================================================ */
function ajaxindicatorstart(text) {
    if ($('body').find('#resultLoading').attr('id') != 'resultLoading') {
        // ajax-loader 이미지 생성 http://www.ajaxload.info/
        $('body').append('<div id="resultLoading" style="display:none"><div><img src="images/indicator/ajax-loader.gif"><div>'+text+'</div></div><div class="bg"></div></div>');
    }

    $('#resultLoading').css({
        'width':'100%',
        'height':'100%',
        'position':'fixed',
        'z-index':'10000000',
        'top':'0',
        'left':'0',
        'right':'0',
        'bottom':'0',
        'margin':'auto'
    });

    $('#resultLoading .bg').css({
        'background':'#000000',
        'opacity':'0',
        'width':'100%',
        'height':'100%',
        'position':'absolute',
        'top':'0'
    });

    $('#resultLoading>div:first').css({
        'width': '250px',
        'height':'75px',
        'text-align': 'center',
        'position': 'fixed',
        'top':'0',
        'left':'0',
        'right':'0',
        'bottom':'0',
        'margin':'auto',
        'font-size':'16px',
        'z-index':'10',
        'color':'#ffffff'

    });

    $('#resultLoading .bg').height('100%');
    $('#resultLoading').fadeIn(300);
    $('body').css('cursor', 'wait');
}

function ajaxindicatorstop() {
    $('#resultLoading .bg').height('100%');
    $('#resultLoading').fadeOut(300);
    $('body').css('cursor', 'default');
}

$.replaceParam = function (param) {
    return param.replace(/\./g, "\\.").replace(/\[/g, "\\[").replace(/\]/g, "\\]");
};

function convertContext(contextParam) {
    var context;
    var contextJson = contextMap.get(contextParam == null ? "ticm" : contextParam);
    context = isLocal ? contextJson.local : contextJson.server;

    return context;
}

$.niceCert = function (callback) {
    $.getJSON("comm/syst/util/encryptMsg.do", {"callback": callback}, function (data) {
        if (data.result.hasOwnProperty("error")) {
            alert(data.result.error);
        } else {
            var niceUrl = "https://nice.checkplus.co.kr/CheckPlusSafeModel/checkplus.cb";
            $.openWindow({url: niceUrl, params: data.result, width: "500px", height: "550px"});
        }
    });
};

/**
 * @desc      : 프로그램 정보를 얻어온다.
 * @comment   : 데이터보안의 조직을 사용할 경우, 화면접근범위와 관련업무코드를 넘겨줘야 하므로
 *              URL로 프로그램의 정보를 얻어온다.
 * @param     : location(popup에서는 opener.location을 넘겨준다.)
 * @create    : 2014.12.11
 * @author    : jsKim
 */
$.getPgmInfo = function(location) {
	try {
	    var pgmUrl = location.pathname;
	    var param = "pgmUrl=" + pgmUrl;
	    var retData = null;
	    $.ajax({
	        dataType : "json",
	        type     : "post",
	        async    : false, // default : true(비동기)
	        url      : "comm/syst/util/findPgmInfoByPgmUrl.do",
	        data     : encodeURI(param), // parameter
	        success  : function(data) {
	            retData = data.pgmInfo;
	        }
	    });
	    return retData;
	} catch (e) {
		return null;
	}
};

$.convertJsonParam = function(params) {
    var param = "";
    var i = 0;
    $.each(params,function(key,value){
        if (i > 0) param += "&";

        param += key + "=" + value;
        i++;
    });
    return param;
};

/**
 * @desc      : Jqeury.fn.val() override
 * @comment   : IE9에서 $.fn.val() 할경우, 실 data는 null이지만 placeholder를 가져오는 문제점이 있다.
 *              $.fn.val()을 override하여 data가 placeholder와 같고 색상이 placeholder와 같으면 ""을 retrun하고,
 *              그 이외는 original val을 호출하여 값을 return한다.
 * @param     :
 * @create    : 2014.12.23
 * @author    : jsKim
 */
$.fn.orgVal = $.fn.val;
$.fn.val = function(value) {
    if (value != undefined) {
        return this.orgVal(value);
    } if (this[0]) {
        var ele= $(this[0]);
        if (ele.attr('placeholder') != ''
            && ele.orgVal() == ele.attr('placeholder')
            && ele.css("color") == "rgb(204, 204, 204)") {
            return "";
        } else {
            return ele.orgVal();
        }
    }
    return undefined;
};

/**
 * @desc      : DB시간을 가져온다.
 * @comment   : dateType - default : YYYYMMDD
 * @param     :
 * @create    : 2014.12.26
 * @author    : jsKim
 */
$.getCurrentDate = function(dateType) {
    dateType = dateType||"";
    var param = "dateType=" + dateType;
    var retData = "";

    $.ajax({
        dataType : "json",
        type     : "post",
        async    : false, // default : true(비동기)
        url      : "comm/syst/util/findCurrentDate.do",
        data     : encodeURI(param), // parameter
        success  : function(data) {
            retData = data.currentDate.toDay;
        }
    });

    return retData;
};

$.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name]) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

$.fn.serializeParam = function() {
    return $.convertJsonParam($(this).serializeObject());
};

$.fn.setAutocomplete = function(orgid) {

    if (orgid) {
        var id = $(this).attr("id");
        var autoPgmInfo = eval("orgLinkPgmInfo"+id);
        $.getJSON("comm/syst/cdmg/findAuthOrgList.do", {orgidOrNm: orgid, acsAlRngCd:autoPgmInfo.acsAlRngCd, relatWokCd:autoPgmInfo.relatWokCd}, function (data) {
            if (data.orgList.length > 0) {
                eval(id+"SetValue___")(data.orgList[0]);
            }
        });
    }
};

/**
 * @desc      : 계좌번호 유효성을 체크한다.
 * @comment   : 유효한 계좌일 경우 message에 예금주명이 반환되고,
 *              실패한 계좌일 경우 message에 실패내용이 나온다.
 *              success - 성공여부
 * @param     : bankCd 은행코드
 * @param     : ban 계좌번호
 * @param     : momey 금액(가상계좌 유효성 체크에 필요)
 * @create    : 2015.03.24
 * @author    : jsKim
 */
function checkBankValid(bankCd,ban,momey) {
    ajaxindicatorstart('');
    var param = "bankCd=" + bankCd + "&ban=" + ban + "&momey=" + momey;
    var retData = "";

    $.ajax({
        dataType : "json",
        type     : "post",
        async    : false, // default : true(비동기)
        url      : "comm/syst/ban/findCmsErr.do",
        data     : encodeURI(param), // parameter
        success  : function(data) {

            retData = data.bankCms;

            if (!retData.success) {
                alert(retData.message);
            }
        }
    });
    ajaxindicatorstop();
    return retData;
}

function getSrecInfo(stuid) {
    if (stuid.length != 8) {
        alert("학번을 8자로 입력하시기 바랍니다.");
        return null;
    } else {
        var retData = null;
        var param = {
            stuid:stuid
        }
        $.ajax({
            dataType : "json",
            type     : "post",
            async    : false, // default : true(비동기)
            url      : "comm/syst/util/popup/findSrecPopupStuInfo.do",
            data     : encodeURI($.convertJsonParam(param)), // parameter
            success  : function(data) {
                if (data.srecList.length == 1) {
                    retData = data.srecList[0];
                } else {
                    retData = null;
                }
            }
        });

        return retData;
    }
}

if (typeof String.prototype.trim !== "function") {
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, "");
    }
}

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

if (typeof String.prototype.startsWith !== "function") {
    String.prototype.startsWith = function (str){
      return this.indexOf(str) == 0;
  };
}