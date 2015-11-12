var comm={
	"menu":[],
	"fav":[],
	"intgUid":"",
	"contextPath":"",
	"convertContext":function(path){
		return comm.context[path][comm.isLocal?"local":"server"];
	},
	"httpReferer":"",
	"isLocal":false,
	"pageAttribute":{},
	"noResult":"<div class=\"box_empty\"><p class=\"tit\">검색 결과가 없습니다.</p><p class=\"txt\">- 검색어가 정확한지 확인하시고, 다시 시도해주세요.</p></div>",
	"init":function(){
		$("body").css("overflow-y","scroll");
		$(".tbl_row tfoot").css({
			"background":"#ecf0f9",
			"color":"#366add",
			"font-weight":"bold"
		});
		if(location.href.indexOf("member/logon.do")==-1&&location.href.indexOf("member/logoff.do")==-1){
			comm.createMenu();
			comm.createFav();
		}
		/**
		 * 링크값이 없는경우는 이벤트를 중지한다.
		 */
		$(document).find("a[href='#']").click(function(e){
			e.preventDefault();
		});
		if(comm.httpReferer.match("^"+(location.protocol+'//'+location.host)+"(.+)")){
			$("#historyBackBtn").click(function(e){
				var uAgent=navigator.userAgent;
				if(uAgent.match(/opr|u;/i)){
					location.href=document.referrer;
				}else{
					history.back();
				}
			});
		}else{
			$("#historyBackBtn").hide();
		}
		/*
		 * if(!$.isMobile()){ $("#_deviceOption").css("visibility","hidden"); }
		 */
		$("#_deviceOption").click(function(e){
			e.preventDefault();
			if($.isMobile()){ // 또는 $.isApp()
				var params=JSON.stringify({
					'header':{
						'resultCode':200,
						'errorMsg':'',
						'cmdCode':3
					},
					'body':{
						'functionType':10,
						'value':{}
					}
				});
				if($.isAndroid()){ // 안드로이드
					$('#_platformType').val("A"); // (플랫폼 구분 값 = 'A')
					window.Android.toNative(params);
				}else{ // iOS
					$('#_platformType').val("I"); // (플랫폼 구분 값 = 'I')
					var iframe=document.createElement('iframe');
					iframe.setAttribute('src','jscall://toNative:'+encodeURIComponent(params));
					document.documentElement.appendChild(iframe);
					iframe.parentNode.removeChild(iframe);
					iframe=null;
				}
			}else{
				alert("웹브라우저에서는 지원되지 않는 기능입니다.")
			}
		});
	},
	"bindEvent":function(target){
		$(target).find(".TEXT_HTML").each(function(){
			$(this).html($(this).html().replace(/\n/gi,"<br/>\n").replace(/\t/gi,"&emsp;").replace(/\s/gi,"&nbsp;"));
		});
		$(target).find(".tabs").tabs({
			ajaxOptions:{
				statusCode:{
					404:function(){}
				}
			}
		});
		$(".MASK_DATE").mask("date");
		return $(target);
	},
	"context":{
		"rein":{
			server:"/rein",
			local:"/ngis-research"
		},
		"tiac":{
			server:"/tiac",
			local:"/ngis-university"
		},
		"tiad":{
			server:"/tiad",
			local:"/ngis-administration"
		},
		"tiaf":{
			server:"/tiaf",
			local:"/ngis-adjunction"
		},
		"ptfo":{
			server:"/ptfo",
			local:"/ngis-portfolio"
		},
		"tisc":{
			server:"/tisc",
			local:"/ngis-scheduler"
		},
		"ticm":{
			server:"",
			local:"/ngis-common"
		},
		"ngis-examples":{
			server:"/ngis-examples",
			local:"/ngis-examples"
		}
	},
	"setLocal":function(local,contextPath){
		comm.isLocal=(local=="local")?true:false;
		comm.contextPath=contextPath;
	},
	"createFav":function(){
		comm.fav=$.sessionStorage.get("fav");
		if(!comm.fav){
			$.ajax({
				dataType:"json",
				type:"post",
				async:false,
				data:{
					"intgUid":comm.intgUid
				},
				url:"comm/syst/pgmm/findFavList.do",
				success:function(result){
					var $targetPgm;
					$.each(result.favList,function(index,fav){
						if(fav.pgmUrl){
							$targetPgm=$("#favWrapper").find("[name$='pgmId']").filter("[value='"+fav.pgmId+"']");
							if($targetPgm.length){
								$targetPgm.closest("li").find("label").click();
								$targetPgm.closest("li").find("[name$='status']").val("4");
							}
						}
					});
					comm.fav=result.favList;
					$.sessionStorage.set("fav",comm.fav);
				}
			});
		}
	},
	"createMenu":function(){ // 신분별 메뉴생성
		var setTitle=function(){
			// 서브페이지 타이틀 연동
			var subMenuId={
				"server":{},
				"local":{
					"3975":"3974",
					"4026":"4025",
					"4098":"4094",
					"3977":"3976",
					"4028":"4027",
					"4099":"4095",
					"3979":"3978",
					"4030":"4029",
					"4100":"4096"
				}
			};
			console.log("현재페이지ID:"+comm.pageAttribute.programId);
			var programId=subMenuId[comm.isLocal?"local":"server"][comm.pageAttribute.programId]?subMenuId[comm.isLocal?"local":"server"][comm.pageAttribute.programId]:comm.pageAttribute.programId
			$.each(comm.menu,function(index,menu1){
				$.each(menu1.menu,function(index,menu2){
					$.each(menu2.menu,function(index,menu3){
						if(menu3.info.pgmId==programId){
							$("#TIT_PAGE").html(menu3.info.menuNm);
						}
					});
				});
			});
		};
		comm.menu=$.sessionStorage.get("menu");
		// comm.menu=null;
		if(comm.menu){
			setTitle();
		}else{
			comm.menu=[];
			$.ajax({
				dataType:"json",
				type:"post",
				async:false, // default : true(비동기)
				url:"findMenu.do",
				success:function(result){
					if(result.menuList){
						var $li,$ul;
						var menu1,menu2=new Array();
						/**
						 * 넘겨받은 메뉴리스트를 객체로 변환시킨다.
						 */
						$.each(result.menuList,function(index,menu){
							if(menu.menuUseYn!='1') return;
							switch(menu.menuLvl){
								case 1:
									menu1=new Array();
									comm.menu.push({
										"info":menu,
										"menu":menu1,
									});
									break;
								case 2:
									menu2=new Array();
									menu1.push({
										"info":menu,
										"menu":menu2,
									});
									break;
								case 3:
									menu2.push({
										"info":menu
									});
									break;
								default:
									break;
							}
						});
					}
					$.sessionStorage.set("menu",comm.menu)
					setTitle();
				}
			});
		}
	}
};
$.ajaxSetup({
	headers:{
		"X-Referer":document.URL
	},
	error:function(xhr,status,index,anchor){}
});
$.fn.__tabs=$.fn.tabs;
$.fn.tabs=function(a,b,c,d,e,f){
	var base=location.href.replace(/#.*$/,'');
	$('ul>li>a[href^="#"]',this).each(function(){
		var href=$(this).attr('href');
		$(this).attr('href',base+href);
	});
	$(this).__tabs(a,b,c,d,e,f);
};
if(!String.prototype.startsWith){
	String.prototype.startsWith=function(searchString,position){
		position=position||0;
		return this.indexOf(searchString,position)===position;
	};
}
if(!String.prototype.endsWith){
	String.prototype.endsWith=function(searchString,position){
		var subjectString=this.toString();
		if(position===undefined||position>subjectString.length){
			position=subjectString.length;
		}
		position-=searchString.length;
		var lastIndex=subjectString.indexOf(searchString,position);
		return lastIndex!==-1&&lastIndex===position;
	};
}
$.isMobile=function(){
	return(/iphone|ipad|ipod|android|opera\smini|opera\smobi|symbian|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase()));
};
$.isAndroid=function(){
	return(/android/i.test(navigator.userAgent.toLowerCase()));
};
$.isApp=function(){
	return(/mobile:Y/i.test(navigator.userAgent.toLowerCase()));
};
$.nativePopup=function(popupUrl){
	if($.isMobile()){
		var params=JSON.stringify({
			'header':{
				'resultCode':200,
				'errorMsg':'',
				'cmdCode':3
			},
			'body':{
				'functionType':1,
				'value':{
					'url':popupUrl
				}
			}
		});
		if($.isAndroid()){
			window.Android.toNative(params);
		}else{
			var iframe=document.createElement('iframe');
			iframe.setAttribute('src','jscall://toNative:'+encodeURIComponent(params));
			document.documentElement.appendChild(iframe);
			iframe.parentNode.removeChild(iframe);
			iframe=null;
		}
	}else{
		window.open(popupUrl);
	}
};
/**
 * @desc : select tag의 option을 추가해준다.
 * @comment :
 * @param :
 * options - selectedVal : 초기 select의 선택값 - callback : select를 생성후 처리할 callback funtion명 - value : select의 option의 value - text : select의 option의 text <option value="1">text</option> - dataList : 조회된 data
 * @create : 2014.10.16
 * @author : jsKim
 */
$.fn.addOptions=function(options){
	$(this).find("option").remove();
	if(!options){
		alert("parameter가 없습니다.");
		return false;
	}
	var placeholder=$(this).data("placeholder");
	if(placeholder){
		$(this).append($("<option>",{
			value:"",
			text:placeholder
		}));
	}
	for(var index=0;index<options.dataList.length;index++){
		$(this).append($("<option>",{
			value:options.dataList[index][options.value],
			text:options.dataList[index][options.text]
		}));
	}
	if(options.selectedVal){
		$(this).selected(options.selectedVal);
	}else{
		$(this).trigger("chosen:updated");
	}
	if(options.callback){
		eval(options.callback)();
	}
};
$.replaceParam=function(param){
	return param.replace(/\./g,"\\.").replace(/\[/g,"\\[").replace(/\]/g,"\\]");
};
var browser=(function(){
	var s=navigator.userAgent.toLowerCase();
	var match=/(chrome)[ \/]([\w.]+)/.exec(s)||/(webkit)[ \/](\w.]+)/.exec(s)||/(opera)(?:.*version)?[ \/](\w.]+)/.exec(s)||/(msie) ([\w.]+)/.exec(s)||!/compatible/.test(s)&&/(mozilla)(?:.*? rv:([\w.]+))?/.exec(s)||[];
	return {
		name:match[1]||"",
		version:match[2]||"0"
	};
}());
$.closeWindow=function(){
	if(browser.name=="mozilla"){
		window.open("about:blank","_self").close();
	}else{
		self.close();
	}
}
$.fn.bindParams=function(params){
	this.template=$(this).prop('outerHTML');
	do{
		var temp=this.template.match(/\{([0-9a-zA-Z]+)\}/)
		if(temp){
			var name=temp[0].replace(/(\{|\})/g,'');
			this.template=this.template.replace(new RegExp("\\{"+name+"\\}","g"),params[name]!=null?params[name]:"");
		}
	}while(temp);
	return $(this).html($(this.template).html());
};
$.fn.addRow=function(template,params){
	this.template=$(template).prop('outerHTML');
	do{
		var temp=this.template.match(/\{([0-9a-zA-Z]+)\}/)
		if(temp){
			var name=temp[0].replace(/(\{|\})/g,'');
			this.template=this.template.replace(new RegExp("\\{"+name+"\\}","g"),params[name]!=null?params[name]:"");
		}
	}while(temp);
	var $object=$(this.template)
	$object.appendTo(this);
	return $object;
};
$.openWindow=function(options){
	var popupWindowName="__COMMON_WINDOW__"+Math.floor((Math.random()*10000000000000000)+1);
	var url=options.context!=undefined?convertContext(options.context)+"/"+options.url:options.url;
	var elements="";
	if($.isArray(options.params)){
		$.each(options.params,function(index,params){
			elements+="<input type='hidden' name='"+params.name+"' value='"+params.value+"'>";
		});
	}else{
		if(options.params!=undefined&&options.params!=null){
			$.each(options.params,function(name,value){
				elements+="<input type='hidden' name='"+name+"' value='"+value+"'>";
			});
		}
	}
	var $form=$("<form method='post' action='"+url+"' target='"+popupWindowName+"'>"+elements+"</form>").appendTo("body");
	var w=window.open("",popupWindowName);
	$form.submit().remove();
	return w;
};
$.submit=function(url,params){
	if(!url){
		alert("url은 필수값입니다.");
		return false;
	}
	var elements="";
	$.each(params,function(key,value){
		elements+="<input type='hidden' name='"+key+"' value='"+value+"'>";
	});
	$("<form method='post' action='"+url+"'>"+elements+"</form>").appendTo("body").submit().remove();
};
(function($){
	$.fn.params=function(){
		var params={};
		$.each($(this).find("input,select,textarea").serializeArray(),function(index,object){
			params[object.name]=object.value;
		});
		return params;
	};
})(jQuery);
(function($){
	$.fn.layout=function(params,cellBack){
		var removeYn=$(document).find($(this)).length<=0;
		$(this).dialog($.extend({
			"autoOpen":true,
			"modal":true,
			"position":"center",
			"width":$("#contents").width()-50,
			"close":function(){
				if(removeYn) $(this).remove();
			},
			"create":params.create?params.create:function(){
				comm.bindEvent($(this));
			},
			buttons:[{
				text:"확인",
				click:function(){
					if(cellBack){
						if(cellBack()){
							$(this).dialog("close");
						}
					}else{
						$(this).dialog("close");
					}
				}
			}]
		},params));
	};
})(jQuery);
$.ui.dialog.prototype._focusTabbable=function(){};