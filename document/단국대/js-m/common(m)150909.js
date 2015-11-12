var comm={
	/**
	 * 모바일 메뉴 리스트
	 */
	"menu":[],
	/**
	 * 즐겨찾기 메뉴 리스트
	 */
	"fav":[],
	/**
	 * 사용자 계정정보ID
	 */
	"intgUid":"",
	/**
	 * 현재 컨테이너
	 */
	"contextPath":"",
	/**
	 * 이전페이지 주소
	 */
	"httpReferer":"",
	/**
	 * 개발환경여부
	 */
	"isLocal":false,
	/**
	 * 현재페이지 정보
	 */
	"pageAttribute":{},
	/**
	 * 메인페이지를 제외한 최근에 사용했던 매뉴정보
	 */
	"refererPageAttribute":{},
	/**
	 * NoResult HTML 템플릿
	 */
	"noResult":"<div class=\"box_empty\"><p class=\"tit\">{title}</p><p class=\"txt\">{content}</p></div>",
	/**
	 * 서비스별 컨텍스트 정보
	 */
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
	"convertContext":function(path){
		return comm.context[path][comm.isLocal?"local":"server"];
	},
	"init":function(){
		/**
		 * 메인페이지 일경우는 스토리지 정보를 삭제한다.
		 */
		(function(){
			if(location.href.indexOf("main.do")!=-1){
				if(!$.sessionStorage.isEmpty()){
					comm.refererPageAttribute=$.sessionStorage.get("refererPageAttribute");
					$.sessionStorage.removeAll();
					$.sessionStorage.set("refererPageAttribute",comm.refererPageAttribute);
				}
			}else{
				$.sessionStorage.set("refererPageAttribute",comm.pageAttribute);
			}
		})();
		/**
		 * 전체매뉴 클릭시.. 메인페이지일때 예외상황처리
		 */
		(function(){
			if(location.href.indexOf("main.do")!=-1){
				$("#mainTabs2").click(function(e){
					e.preventDefault();
					$(".btn_open_aside").click();
					$(".tabs").tabs("option","active",1);
				});
			}else{
				$.sessionStorage.set("refererPageAttribute",comm.pageAttribute);
				$("#mainTabs2").click(function(e){
					location.href=$("base").attr("href")+"main.do#tabs2";
				});
			}
		})();
		/**
		 * 로그인페이지가 아닐경우 메뉴및 즐겨찾기 메뉴를 생성하지 않도록 처리한다.
		 */
		(function(){
			if(location.href.indexOf("member/logon.do")==-1&&location.href.indexOf("member/logoff.do")==-1){
				comm.createMenu();
				comm.createFav();
			}else{
				$(".btn_open_aside").hide();
			}
		})();
		/**
		 * 즐겨찾기 메뉴생성
		 */
		(function(){
			var $template=$('<li><a href="menu?redirectUrl={url}" class="{icon}">{text}</a></li>');
			$.each(comm.fav,function(index,fav){
				if(fav.pgmUrl){
					$("#sideFavList").addRow($template,{
						"url":comm.context[fav.pgmBasUrl?fav.pgmBasUrl:"ticm"][comm.isLocal?"local":"server"]+fav.pgmUrl,
						"text":fav.pgmNm,
						"icon":fav.iconNm
					});
				}
			});
			/* 즐겨찾기 메뉴가 없을때 해당 레이아웃을 삭제한다. */
			if(!$("#sideFavList li").length){
				$("#sideFavList").closest("div").remove();
			}
		})();
		/**
		 * 뒤로가기 버튼 이벤트 설정
		 */
		(function(){
			if(comm.httpReferer.match("^"+(location.protocol+'//'+location.host)+"(.+)")&&comm.httpReferer.indexOf("member/logon.do")==-1&&comm.httpReferer.indexOf("member/logoff.do")==-1&&location.href.indexOf("member/logoff.do")==-1&&location.href.indexOf("member/logoff.do")==-1){
				$("#historyBackBtn").click(function(e){
					var uAgent=navigator.userAgent;
					if(uAgent.match(/opr|u;/i)){
						location.href=document.referrer;
					}else{
						history.back();
					}
				});
			}else{
				$("#historyBackBtn").click(function(e){
					location.href="main.do";
				});
			}
		})();
		/**
		 * 디바이스 알림설정 뷰
		 */
		(function(){
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
		})();
		/**
		 * 페이지 초기로드시 이벤트를 할당한다.
		 */
		(function(){
			comm.bindEvent($(document));
		})();
	},
	"bindEvent":function(target){
		/**
		 * textarea형식에 대한 문자열을 태그형태로 변경한다.
		 */
		$(target).find(".TEXT_HTML").each(function(){
			$(this).html($(this).html().replace(/\n/gi,"<br/>\n").replace(/\t/gi,"&emsp;").replace(/\s/gi,"&nbsp;"));
		});
		/**
		 * 문자열을 날자형태로 변환한다.
		 */
		$(target).find(".MASK_DATE").mask("date");
		/**
		 * 문자열을 자리수에 맞게 콤마를 추가한다.
		 */
		$(target).find(".MASK_CURRENCY").numberFormat();
		/**
		 * 각각에 브라우저나 앱에 맞는 팝업창을 띄우도록 한다.
		 */
		$(target).find(".NATEVE_OPEN").click(function(e){
			e.preventDefault();
			$.nativePopup($(this).attr("href"));
		});
		/**
		 * 제이쿼리 탭매뉴를 생성한다.
		 */
		$(target).find(".tabs").tabs();
		/**
		 * 테이블 해더에 등록된 체크박스에 따라 tbody에 체크박스를 전체선택한다.
		 */
		$(target).find("table > thead > tr > th").on("click",".check_all",function(e){
			var $parents=$(this).parents("table"); // 선택된 checkbox의 table
			var chkIndex=($(this).parents("th").index()+1); // 선택된 checkbox의 index
			var checked=$(this).prop("checked"); // check여부
			$parents.find("tbody > tr >td:nth-child("+chkIndex+")").find(":checkbox").prop("checked",checked); // tbody의 선택된 index에 해당하는 checkobx 를 check여부에 따라 셋팅
		});
		/**
		 * 링크값이 없는경우는 이벤트를 중지한다.
		 */
		$(target).find("a[href='#']").click(function(e){
			e.preventDefault();
		});
		return $(target);
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