var comm = {
	/**
	 * 모바일 메뉴 리스트
	 */
	"menu" : [] ,
	/**
	 * 즐겨찾기 메뉴 리스트
	 */
	"favMob" : [] ,
	/**
	 * 사용자 계정정보ID
	 */
	"intgUid" : "" ,
	/**
	 * 사용자 조직ID
	 */
	"orgId" : "" ,
	/**
	 * 사용자 유형코드
	 */
	"userTyCd" : "" ,
	/**
	 * 현재 컨테이너
	 */
	"contextPath" : "" ,
	/**
	 * 이전페이지 주소
	 */
	"httpReferer" : "" ,
	/**
	 * 개발환경여부
	 */
	"isLocal" : false ,
	/**
	 * 현재페이지 정보
	 */
	"pageAttribute" : {} ,
	/**
	 * 현재페이지 권한
	 */
	"permission" : {} ,
	/**
	 * 메인페이지를 제외한 최근에 사용했던 매뉴정보
	 */
	"refererPageAttribute" : {} ,
	/**
	 * NoResult HTML 템플릿
	 */
	"noResult" : "<div class=\"box_empty\"><p class=\"tit\">{title}</p><p class=\"txt\">{content}</p></div>" ,
	/**
	 * 서비스별 컨텍스트 정보
	 */
	"mainTabIndex" : 0 ,
	/**
	 * 클라이언트 아이피번호
	 */
	"remoteAddr" : null ,
	/**
	 * 서비스별 컨텍스트 정보
	 */
	"context" : {
		"rein" : {
			"server" : "/rein" ,
			"local" : "/ngis-research"
		} ,
		"tiac" : {
			"server" : "/tiac" ,
			"local" : "/ngis-university"
		} ,
		"tiad" : {
			"server" : "/tiad" ,
			"local" : "/ngis-administration"
		} ,
		"tiaf" : {
			"server" : "/tiaf" ,
			"local" : "/ngis-adjunction"
		} ,
		"ptfo" : {
			"server" : "/ptfo" ,
			"local" : "/ngis-portfolio"
		} ,
		"tisc" : {
			"server" : "/tisc" ,
			"local" : "/ngis-scheduler"
		} ,
		"ticm" : {
			"server" : "" ,
			"local" : "/ngis-common"
		} ,
		"ngis-examples" : {
			"server" : "/ngis-examples" ,
			"local" : "/ngis-examples"
		}
	} ,
	"setLocal" : function ( local ,contextPath ) {
		comm.isLocal = ( local == "local" ) ? true : false;
		comm.contextPath = contextPath;
	} ,
	"convertContext" : function ( path ) {
		return comm.context[ path ][ comm.isLocal ? "local" : "server" ];
	} ,
	"init" : function () {
		/**
		 * $(document).ready(comm.init); 도큐먼트가 시작할 때 실행되는 메소드(tiles=>mobileLayout.jsp)에서만 호출한다. 모든페이지에서 사용되며, 각각에 요소에 대한 이벤트를 설정하거나 제어한다.
		 */
		/**
		 * 개발환경이 아닐경우 반응형 웹페이지로 리다이렉트한다.
		 */
		if ( !$.isApp() && !comm.isLocal && ( comm.remoteAddr && !comm.remoteAddr.match( /^220\.149\.224\.([0-9]+)/ ) ) ) {
			location.href = "https://www.dankook.ac.kr";
			return;
		}
		/**
		 * 메인페이지일 경우 스토리지 정보를 삭제한다.
		 */
		if ( !$.sessionStorage.isEmpty() ) {
			comm.mainTabIndex = $.sessionStorage.get( "mainTabIndex" );
			comm.refererPageAttribute = $.sessionStorage.get( "refererPageAttribute" );
		}
		/**
		 * 전체매뉴 클릭시.. 메인페이지일때 예외상황처리
		 */
		( function () {
			// 메인페이지일경우 페이지 이동을 하지 않는다.
			if ( location.href.indexOf( "main.do" ) != -1 ) {
				$( "#mainTabs1" ).click( function ( e ) {
					e.preventDefault();
					$( ".btn_open_aside" ).click();
					$( "#tab_header_menu" ).tabs( "option" ,"active" ,0 );
					$.sessionStorage.set( "refererPageAttribute" ,{} );
				} );
				$( "#mainTabs2" ).click( function ( e ) {
					e.preventDefault();
					$( ".btn_open_aside" ).click();
					$( "#tab_header_menu" ).tabs( "option" ,"active" ,1 );
					$.sessionStorage.set( "refererPageAttribute" ,{} );
				} );
			} else {
				// 메인페이지가 아닐경우 페이지를 이동한다.
				$( "#mainTabs1" ).click( function ( e ) {
					e.preventDefault();
					$.sessionStorage.set( "mainTabIndex" ,0 );
					$.sessionStorage.set( "refererPageAttribute" ,{} );
					location.href = $( "base" ).attr( "href" ) + "main.do";
				} );
				$( "#mainTabs2" ).click( function ( e ) {
					e.preventDefault();
					$.sessionStorage.set( "mainTabIndex" ,1 );
					$.sessionStorage.set( "refererPageAttribute" ,{} );
					location.href = $( "base" ).attr( "href" ) + "main.do";
				} );
			}
		} )();
		/**
		 * 로그인페이지가 아닐경우 메뉴 및 즐겨찾기 메뉴를 생성하지 않도록 처리한다.
		 */
		( function () {
			if ( location.href.indexOf( "member/logon.do" ) == -1 && location.href.indexOf( "member/logoff.do" ) == -1 ) {
				comm.createMenu();
				comm.createFav();
			} else {
				$( ".btn_open_aside" ).hide();
			}
		} )();
		/**
		 * 즐겨찾기 메뉴생성
		 */
		( function () {
			var $li = $( "#sideFavMobList" ).find( "li" ).clone();
			$( "#sideFavMobList" ).find( "li" ).remove()
			if ( comm.favMob ) {
				$.each( comm.favMob ,function ( index ,favMob ) {
					if ( favMob.pgmUrl ) {
						$( "#sideFavMobList" ).addRow( $li.clone() ,$.extend( favMob ,{
							"url" : favMob.pgmUrl.match( /http(s)?\:\/\/(.+)/ ) ? favMob.pgmUrl : "menu?redirectUrl=" + comm.context[ favMob.pgmBasUrl ? favMob.pgmBasUrl : "ticm" ][ comm.isLocal ? "local" : "server" ] + favMob.pgmUrl ,
							"index" : index
						} ) );
					} else {
						$( "#sideFavMobList" ).addRow( $li.clone() ,$.extend( favMob ,{
							"url" : "#" + favMob.uprMenuId + "&" + favMob.menuId ,
							"index" : index
						} ) );
					}
				} );
			}
			/* 즐겨찾기 메뉴가 없을때 해당 레이아웃을 삭제한다. */
			if ( !$( "#sideFavMobList li" ).length ) {
				$( "#sideFavMobList" ).addRow( "<li style='width:100%;'>" + comm.noResult + "</li>" ,{
					"title" : "등록된 즐겨찾기 서비스가 없습니다."
				} );
			} else {
				$( "#sideFavMobList" ).sortable( {
					placeholder : "ui-state-highlight" ,
					update : function ( event ,ui ) {
						$( "#sideFavMobList" ).find( "[name$='sortOer']" ).each( function ( i ) {
							$( this ).val( i + 1 );
						} );
						$.ajax( {
							dataType : "json" ,
							type : "post" ,
							async : false ,
							data : $( "#sideFavMobList" ).find( "input" ).serializeArray() ,
							url : "comm/syst/pgmm/saveFavMobList.do" ,
							success : function ( result ) {
								$.sessionStorage.set( "favMob" ,null );
								if ( location.href.match( /(.+)main\.do(.+)?/ ) ) {
									$( "#sideFavMobList" ).addClass( "changed" );
								}
							}
						} );
					}
				} ).disableSelection();
			}
		} )();
		/**
		 * 뒤로가기 버튼 이벤트 설정
		 */
		( function () {
			if ( location.href.match( /(main|member\/(logoff|logon))/ ) ) {
				$( "#historyBackBtn" ).remove();
			} else {
				$( "#historyBackBtn" ).click( function ( e ) {
					e.preventDefault();
					if ( comm.httpReferer ) {
						var uAgent = navigator.userAgent;
						if ( uAgent.match( /opr|u;/i ) ) {
							location.href = document.referrer;
						} else {
							history.back();
						}
					} else {
						location.href = "main.do";
					}
				} );
			}
		} )();
		/**
		 * 디바이스 알림설정 뷰
		 */
		( function () {
			if ( $.isMobile() ) {
				$( "#_deviceOption" ).click( function ( e ) {
					e.preventDefault();
					if ( $.isMobile() ) { // 또는 $.isApp()
						var params = JSON.stringify( {
							'header' : {
								'resultCode' : 200 ,
								'errorMsg' : '' ,
								'cmdCode' : 3
							} ,
							'body' : {
								'functionType' : 10 ,
								'value' : {}
							}
						} );
						if ( $.isAndroid() ) { // 안드로이드
							$( '#_platformType' ).val( "A" ); // (플랫폼
							// 구분 값
							// =
							// 'A')
							window.Android.toNative( params );
						} else { // iOS
							$( '#_platformType' ).val( "I" ); // (플랫폼
							// 구분 값
							// =
							// 'I')
							var iframe = document.createElement( 'iframe' );
							iframe.setAttribute( 'src' ,'jscall://toNative:' + encodeURIComponent( params ) );
							document.documentElement.appendChild( iframe );
							iframe.parentNode.removeChild( iframe );
							iframe = null;
						}
					} else {
						alert( "웹브라우저에서는 지원되지 않는 기능입니다." );
						return;
					}
				} );
			} else {
				$( "#_deviceOption" ).parents( "li" ).remove();
			}
		} )();
		/**
		 * 페이지 초기로드시 이벤트를 할당한다.
		 */
		( function () {
			comm.bindEvent( $( document ) );
		} )();
	} ,
	"bindEvent" : function ( target ) {
		/**
		 * 파라메터로 넘어오는 타겟에 대한 요소에 대한 이벤트를 설정하거나 제어한다.
		 */
		/**
		 * textarea형식에 대한 문자열을 태그형태로 변경한다. <div class="TEXT_HTML">\r\n\t\s\s\s</div>
		 */
		$( target ).find( ".TEXT_HTML" ).each( function () {
			$( this ).html( $( this ).html().replace( /\n/gi ,"<br/>\n" ).replace( /\t/gi ,"&emsp;" ).replace( /\s/gi ,"&nbsp;" ) );
		} );
		/**
		 * 문자열을 날짜형태로 변환한다.
		 */
		$( target ).find( ".MASK_DATE" ).mask( "date" );
		/**
		 * 문자열을 자리수에 맞게 콤마를 추가한다.
		 */
		$( target ).find( ".MASK_CURRENCY" ).numberFormat();
		/**
		 * 각각에 브라우저나 앱에 맞는 팝업창을 띄우도록 한다.
		 */
		$( target ).find( ".NATEVE_OPEN" ).click( function ( e ) {
			e.preventDefault();
			$.nativePopup( {
				"url" : $( this ).attr( "href" ) ,
				"title" : $( this ).attr( "title" )
			} );
		} );
		/**
		 * 모바일 내장 브라우저(사파리,크롬)로 팝업을 띄운다.
		 */
		$( target ).find( ".OPEN_BROWSER" ).click( function ( e ) {
			e.preventDefault();
			$.nativePopup( {
				"url" : $( this ).attr( "href" ) ,
				"title" : $( this ).attr( "title" ) ,
				"openBrowser" : 1
			} );
		} );
		/* 작성자명 비밀처리 작성자=> 작*자 */
		$( ".SECRET_NM" ).each( function () {
			var params = $( this ).data( "params" );
			var wrirNm = $( this ).text();
			var firstNm = wrirNm.substr( 0 ,1 );
			while ( firstNm.length < wrirNm.length - 1 )
				firstNm = firstNm + escape( "*" );
			$( this ).text( firstNm + wrirNm.substr( wrirNm.length - 1 ,1 ) );
		} );
		/**
		 * 제이쿼리 탭메뉴를 생성한다.
		 */
		$( target ).find( ".tabs" ).tabs();
		/**
		 * 테이블 헤더에 등록된 체크박스에 따라 tbody에 체크박스를 전체선택한다.
		 */
		$( target ).find( "table > thead > tr > th" ).on( "click" ,".check_all" ,function ( e ) {
			var $parents = $( this ).parents( "table" ); // 선택된 checkbox의
			// table
			var chkIndex = ( $( this ).parents( "th" ).index() + 1 ); // 선택된
			// checkbox의
			// index
			var checked = $( this ).prop( "checked" ); // check여부
			$parents.find( "tbody > tr >td:nth-child(" + chkIndex + ")" ).find( ":checkbox" ).prop( "checked" ,checked ); // tbody의
			// 선택된
			// index에
			// 해당하는
			// checkobx
			// 를
			// check여부에
			// 따라
			// 셋팅
		} );
		/**
		 * 링크값이 없는경우는 이벤트를 취소한다.
		 */
		$( target ).find( "a[href='#']" ).click( function ( e ) {
			e.preventDefault();
		} );
		return $( target );
	} ,
	/**
	 * 즐겨찾기를 생성한다.
	 */
	"createFav" : function () {
		comm.favMob = $.sessionStorage.get( "favMob" );
		if ( !comm.favMob ) {
			$.ajax( {
				dataType : "json" ,
				type : "post" ,
				async : false ,
				data : {
					"intgUid" : comm.intgUid
				} ,
				url : "comm/syst/pgmm/findFavMobList.do" ,
				success : function ( result ) {
					var $targetPgm;
					$.each( result.favMobList ,function ( index ,favMob ) {
						if ( favMob.pgmUrl ) {
							$targetPgm = $( "#favMobWrapper" ).find( "[name$='pgmId']" ).filter( "[value='" + favMob.pgmId + "']" );
							if ( $targetPgm.length ) {
								$targetPgm.closest( "li" ).find( "label" ).click();
								$targetPgm.closest( "li" ).find( "[name$='status']" ).val( favMob.status );
							}
						}
					} );
					comm.favMob = result.favMobList;
					if ( !comm.favMob || !comm.favMob.length ) {
						comm.defaultFavSet();
					}
					$.sessionStorage.set( "favMob" ,comm.favMob );
				}
			} );
		}
	} ,
	"createMenu" : function () {
		/**
		 * 메뉴를 생성한다.
		 */
		var setTitle = function () {
			$.each( comm.menu ,function ( index ,menu1 ) {
				$.each( menu1.menu ,function ( index ,menu2 ) {
					$.each( menu2.menu ,function ( index ,menu3 ) {
						if ( menu3.info.pgmId == comm.pageAttribute.programId ) {
							$( "#wrap" ).addClass( "wrap_view" );
							$( "#TIT_PAGE" ).html( menu3.info.menuNm );
						}
					} );
				} );
			} );
			// 페이지정보가 없는페이지는 별도 타이틀을 제공한다.
			if ( !$( "#wrap" ).is( ".wrap_view" ) ) {
				var getPageTitle = function ( url ) {
					var title;
					if ( url.match( /(.+)member\/userIdcrd\.do(.+)?/ ) ) {
						title = "모바일 신분증"
					} else if ( url.match( /(.+)member\/changePasswordForm\.do(.+)?/ ) ) {
						title = "비밀번호변경"
					} else if ( url.match( /(.+)views\/findUserPushSetupForm\.do(.+)?/ ) ) {
						title = "알림수신설정"
					} else if ( url.match( /(.+)views\/findUserCommFavForm\.do(.+)?/ ) ) {
						title = "메뉴 편집"
					} else if ( url.match( /(.+)vocm\/findMannList\.do(.+)?/ ) ) {
						title = "공지사항"
					} else if ( url.match( /(.+)vocm\/findMyVocList\.do(.+)?/ ) ) {
						title = "My VOC"
					} else if ( url.match( /(.+)vocm\/findVocList\.do(.+)?/ ) ) {
						title = "Q&A"
					} else if ( url.match( /(.+)vocm\/findFaqList\.do(.+)?/ ) ) {
						title = "FAQ"
					} else if ( url.match( /(.+)(vocm\/findAudtList)\.do(.+)?/ ) ) {
						title = "칭찬/불친절신고함"
					}
					return title;
				};
				if ( getPageTitle( location.href ) ) {
					$( "#wrap" ).addClass( "wrap_view" );
					$( "#TIT_PAGE" ).html( getPageTitle( location.href ) );
				}
			}
		};
		comm.menu = $.sessionStorage.get( "menuMob" );
		if ( comm.menu ) {
			setTitle();
		} else {

			comm.menu = [];
			$.ajax( {
				dataType : "json" ,
				type : "post" ,
				async : false ,
				url : "findMenu.do" ,
				success : function ( result ) {
					if ( result.menuList ) {
						var $li ,$ul;
						var menu1 = new Array();
						var menu2 = new Array();
						$.each( result.menuList ,function ( index ,menu ) {
							if ( menu.menuUseYn != '1' ) return;
							switch ( menu.menuLvl ) {
								case 1 :
									menu1 = new Array();
									comm.menu.push( {
										"info" : menu ,
										"menu" : menu1
									} );
									break;
								case 2 :
									menu2 = new Array();
									menu1.push( {
										"info" : menu ,
										"menu" : menu2
									} );
									break;
								case 3 :
									menu2.push( {
										"info" : menu
									} );
									break;
								default :
									break;
							}
						} );
					}
					$.sessionStorage.set( "menuMob" ,comm.menu )
					setTitle();
				}
			} );
		}
	} ,
	"defaultFavSet" : function () {// 즐겨찾기 기본메뉴생성
		if ( comm.userTyCd.match( /^(1101|1102|1201|1202)$/ ) ) {
			comm.favMob = [ {
				"pgmUrl" : "/univ/lssn/ttmg/views/findTkcrsTmtblList.do" ,
				"pgmBasUrl" : "tiac" ,
				"sortOer" : null ,
				"pgmId" : "4843" ,
				"status" : "2" ,
				"uprMenuId" : "MUNIV" ,
				"menuId" : "MLESN" ,
				"pgmNm" : "수강시간표" ,
				"iconNm" : "ico_lsn"
			} ,{
				"pgmUrl" : null ,
				"pgmBasUrl" : null ,
				"sortOer" : null ,
				"pgmId" : "0" ,
				"status" : "2" ,
				"uprMenuId" : "MPTAL" ,
				"menuId" : "MJMNU" ,
				"pgmNm" : "금주의 식단" ,
				"iconNm" : "ico_mnu"
			} ,{
				"pgmUrl" : "/univ/lssn/bztm/views/findLecrAttndCfmDscList.do" ,
				"pgmBasUrl" : "tiac" ,
				"sortOer" : null ,
				"pgmId" : "4844" ,
				"status" : "2" ,
				"uprMenuId" : "MUNIV" ,
				"menuId" : "MLESN" ,
				"pgmNm" : "출석확인조회" ,
				"iconNm" : "ico_lsn"
			} ];
		} else if ( comm.userTyCd.match( /^(1301|1304)$/ ) ) {// 교수/시간강사
			comm.favMob = [ {
				"pgmUrl" : "/admi/payr/salm/views/findSalDscList.do" ,
				"pgmBasUrl" : "tiad" ,
				"sortOer" : null ,
				"pgmId" : "4829" ,
				"status" : "2" ,
				"uprMenuId" : "MUNIV" ,
				"menuId" : "MDSAL" ,
				"pgmNm" : "급여지급내역" ,
				"iconNm" : "ico_sl"
			} ,{
				"pgmUrl" : "/univ/lssn/lpci/views/findProfLctTmtblList.do" ,
				"pgmBasUrl" : "tiac" ,
				"sortOer" : null ,
				"pgmId" : "5800" ,
				"status" : "2" ,
				"uprMenuId" : "MUNIV" ,
				"menuId" : "MLESN" ,
				"pgmNm" : "강의시간표" ,
				"iconNm" : "ico_lsn"
			} ,{
				"pgmUrl" : null ,
				"pgmBasUrl" : null ,
				"sortOer" : null ,
				"pgmId" : "0" ,
				"status" : "2" ,
				"uprMenuId" : "MPTAL" ,
				"menuId" : "MJMNU" ,
				"pgmNm" : "금주의 식단" ,
				"iconNm" : "ico_mnu"
			} ];
		} else if ( comm.userTyCd.match( /^(1401|1501)$/ ) ) {// 직원/조교
			comm.favMob = [ {
				"pgmUrl" : "/admi/payr/salm/views/findSalDscList.do" ,
				"pgmBasUrl" : "tiad" ,
				"sortOer" : null ,
				"pgmId" : "4829" ,
				"status" : "2" ,
				"uprMenuId" : "MUNIV" ,
				"menuId" : "MDSAL" ,
				"pgmNm" : "급여지급내역" ,
				"iconNm" : "ico_sl"
			} ,{
				"pgmUrl" : null ,
				"pgmBasUrl" : null ,
				"sortOer" : null ,
				"pgmId" : "0" ,
				"status" : "2" ,
				"uprMenuId" : "MPTAL" ,
				"menuId" : "MJMNU" ,
				"pgmNm" : "금주의 식단" ,
				"iconNm" : "ico_mnu"
			} ];
		} else {
			comm.favMob = [ {
				"pgmUrl" : null ,
				"pgmBasUrl" : null ,
				"sortOer" : null ,
				"pgmId" : "0" ,
				"status" : "2" ,
				"uprMenuId" : "MPTAL" ,
				"menuId" : "MJMNU" ,
				"pgmNm" : "금주의 식단" ,
				"iconNm" : "ico_mnu"
			} ];
		}
	} ,
	"orgidList" : function ( params ,cellBack ) {
		/**
		 * 로그인 사용자에게 부여된 조직목록을 가져온다.
		 */
		$.ajax( {
			dataType : "json" ,
			type : "post" ,
			async : false , // default : true(비동기)
			url : "comm/syst/util/findPgmInfoByPgmUrl.do" ,
			data : {
				pgmUrl : location.pathname
			} ,
			success : function ( result ) {
				var pgmInfo = result.pgmInfo;
				$.ajax( {
					dataType : "json" ,
					type : "post" ,
					async : false ,
					url : "comm/syst/cdmg/findOrgList.do" ,
					data : $.extend( {
						"relatWokCd" : pgmInfo.relatWokCd ,
						"acsAlRngCd" : pgmInfo.acsAlRngCd ,
						"userOrgid" : comm.orgId ,
						"popupYn" : 'grid' ,
						"intgUid" : comm.intgUid
					} ,params ) ,
					success : function ( result ) {
						return cellBack( result.orgList )
					}
				} );
			}
		} );
	}
};