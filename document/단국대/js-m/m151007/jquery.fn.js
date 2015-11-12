$.ajaxSetup( {
	headers : {
		"X-Referer" : document.URL
	}
} );
$.fn.__tabs = $.fn.tabs;
$.fn.tabs = function ( a ,b ,c ,d ,e ,f ) {
	var base = location.href.replace( /#.*$/ ,'' );
	$( 'ul:first>li>a[href^="#"]' ,this ).each( function () {
		var href = $( this ).attr( 'href' );
		$( this ).attr( 'href' ,base + href );
	} );
	$( this ).__tabs( a ,b ,c ,d ,e ,f );
};
$.ui.dialog.prototype._focusTabbable = function () {};
if ( !String.prototype.startsWith ) {
	String.prototype.startsWith = function ( searchString ,position ) {
		position = position || 0;
		return this.indexOf( searchString ,position ) === position;
	};
}
$.fn.selected = function ( val ,parentWindow ) {
	if ( val != undefined && val != null ) {
		if ( parentWindow ) {
			parentWindow.$( this ).val( val ).trigger( "chosen:updated" ).trigger( "change" );
		} else {
			$( this ).val( val ).trigger( "chosen:updated" );
		}
	}
	return $( this );
};
if ( !String.prototype.endsWith ) {
	String.prototype.endsWith = function ( searchString ,position ) {
		var subjectString = this.toString();
		if ( position === undefined || position > subjectString.length ) {
			position = subjectString.length;
		}
		position -= searchString.length;
		var lastIndex = subjectString.indexOf( searchString ,position );
		return lastIndex !== -1 && lastIndex === position;
	};
}
$.isMobile = function () {
	// return(/iphone|ipad|ipod|android|opera\smini|opera\smobi|symbian|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase()));
	return ( /mobile:Y/i.test( navigator.userAgent.toLowerCase() ) );
};
$.isAndroid = function () {
	return ( /android/i.test( navigator.userAgent.toLowerCase() ) );
};
$.isApp = function () {
	return ( /mobile:Y/i.test( navigator.userAgent.toLowerCase() ) );
};
$.nativePopup = function ( conf ) {
	// 생활관일때..
	if ( conf.url.match( /http(s)?\:\/\/(ch)?domi(.+)/gi ) && !conf.url.match( /(.+)enc\=/ ) ) {
		$.ajax( {
			dataType : "json" ,
			type : "post" ,
			async : false , // default : true(비동기)
			url : "findDomiKey.do" ,
			success : function ( result ) {
				if ( result.key ) {
					conf.url = conf.url + "&enc=" + result.key;
				}
				$.nativePopup( conf );
			}
		} );
		return;
	} else if ( conf.url.indexOf( "://" ) == -1 ) {
		conf.url = $( "base" ).attr( "href" ) + conf.url;
	}
	if ( $.isMobile() ) {
		var params = JSON.stringify( {
			'header' : {
				'resultCode' : 200 ,
				'errorMsg' : '' ,
				'cmdCode' : 3
			} ,
			'body' : {
				'functionType' : 1 ,
				'value' : {
					'url' : conf.url ,
					"title" : conf.title
				}
			}
		} );
		if ( $.isAndroid() ) {
			window.Android.toNative( params );
		} else {
			var iframe = document.createElement( 'iframe' );
			iframe.setAttribute( 'src' ,'jscall://toNative:' + encodeURIComponent( params ) );
			document.documentElement.appendChild( iframe );
			iframe.parentNode.removeChild( iframe );
			iframe = null;
		}
	} else {
		window.open( conf.url );
	}
};
$.removeTags = function ( str ) {
	return str.replace( /\<\/(p|tr|li|div)\>/gi ,"\r\n" ).replace( /<[^>]*>/gi ,"" ).replace( /\r\n/gi ,"<br/>" );
}
/**
 * @desc : select tag의 option을 추가해준다.
 * @comment :
 * @param :
 * options - selectedVal : 초기 select의 선택값 - callback : select를 생성후 처리할 callback funtion명 - value : select의 option의 value - text : select의 option의 text <option value="1">text</option> - dataList : 조회된 data
 * @create : 2014.10.16
 * @author : jsKim
 */
$.fn.addOptions = function ( options ) {
	$( this ).find( "option" ).remove();
	if ( !options ) {
		alert( "parameter가 없습니다." );
		return false;
	}
	var placeholder = $( this ).data( "placeholder" );
	if ( placeholder ) {
		$( this ).append( $( "<option>" ,{
			value : "" ,
			text : placeholder
		} ) );
	}
	for ( var index = 0 ; index < options.dataList.length ; index++ ) {
		$( this ).append( $( "<option>" ,{
			value : options.dataList[ index ][ options.value ] ,
			text : options.dataList[ index ][ options.text ]
		} ) );
	}
	if ( options.selectedVal ) {
		$( this ).selected( options.selectedVal );
	} else {
		$( this ).trigger( "chosen:updated" );
	}
	if ( options.callback ) {
		eval( options.callback )();
	}
};
/**
 * 파라메터정보를 변환한다.
 */
$.replaceParam = function ( param ) {
	return param.replace( /\./g ,"\\." ).replace( /\[/g ,"\\[" ).replace( /\]/g ,"\\]" );
};
/**
 * 해당객체에 파라메터정보를 바인딩한다.
 */
$.fn.bindParams = function ( params ) {
	if ( !params ) params = {};
	this.template = $( this ).prop( 'outerHTML' );
	do {
		var temp = this.template.match( /\{([0-9a-zA-Z]+)\}/ )
		if ( temp ) {
			var name = temp[ 0 ].replace( /(\{|\})/g ,'' );
			this.template = this.template.replace( new RegExp( "\\{" + name + "\\}" ,"g" ) ,params[ name ] != null ? params[ name ] : "" );
		}
	} while ( temp );
	return $( this ).html( $( this.template ).html() );
};
/**
 * 템플릿객체를 해당객체에 바인딩한다.
 */
$.fn.addRow = function ( template ,params ) {
	if ( !params ) params = {};
	this.template = $( template ).prop( 'outerHTML' );
	do {
		var temp = this.template.match( /\{([0-9a-zA-Z]+)\}/ )
		if ( temp ) {
			var name = temp[ 0 ].replace( /(\{|\})/g ,'' );
			this.template = this.template.replace( new RegExp( "\\{" + name + "\\}" ,"g" ) ,params[ name ] != null ? params[ name ] : "" );
		}
	} while ( temp );
	var $object = $( this.template )
	$object.appendTo( this );
	return comm.bindEvent( $object );
};
/**
 * post방식으로 이동하기위해 사용된다.
 */
( function ( $ ) {
	$.submit = function ( url ,params ) {
		if ( !url ) {
			alert( "url은 필수값입니다." );
			return false;
		}
		var elements = "";
		$.each( params ,function ( key ,value ) {
			elements += "<input type='hidden' name='" + key + "' value='" + value + "'>";
		} );
		$( "<form method='post' action='" + url + "'>" + elements + "</form>" ).appendTo( "body" ).submit().remove();
	};
} )( jQuery );
/**
 * 해당객체에서 파라메터정보를 가져온다.
 */
( function ( $ ) {
	$.fn.params = function () {
		var params = {};
		$.each( $( this ).find( "input,select,textarea" ).serializeArray() ,function ( index ,object ) {
			params[ object.name ] = object.value;
		} );
		return params;
	};
} )( jQuery );
/**
 * 모바일 상세보기(다이얼로그 레이아웃) dialogCloseChk,dialogClose,onpopstate => 브라우저 뒤로가기 버튼시 레이아웃닫기 체크
 */
( function ( $ ) {
	var dialogClose = function () {
		var params = location.href.match( /(.+)\#(.+)/ ,"$2" ) ? location.href.replace( /(.+)\#(.+)/ ,"$2" ) : "";
		$( ".ui-dialog .ui-dialog-content" ).each( function () {
			if ( params.indexOf( $( this ).attr( "id" ) ) == -1 ) {
				$( this ).attr( "closeCall" ,"true" ).dialog( "close" );
			}
		} );
	};
	window.onpopstate = function ( event ) {
		try {
			if ( location.href.match( /(.+)?member\/logon.do(.+)?/ ) ) {
				history.go( history.length * -1 );
			}
		} catch ( e ) {}
		dialogClose();
	};
	$.fn.layout = function ( params ) {
		var scrollHeight = document.body.scrollTop;
		var removeYn = $( document ).find( $( this ) ).length <= 0;
		if ( $( this ).find( ".LAYOUT_CLOSE_BTN" ).length || $( this ).is( "#exportReportView" ) ) {
			$( this ).find( ".LAYOUT_CLOSE_BTN" ).click( function ( e ) {
				e.preventDefault();
				$( this ).closest( ".ui-dialog" ).find( ".ui-dialog-titlebar-close" ).click();
			} );
			params.buttons = [];
		}
		var dialogId = null;
		if ( !$( this ).attr( "id" ) ) {
			$( this ).attr( "id" ,"DIALOG_LAYOUT_" + new Date().getTime().toString() );
		} else if ( $( this ).attr( "id" ).indexOf( "DIALOG_LAYOUT_" ) == -1 ) {
			$( this ).attr( "id" ,"DIALOG_LAYOUT_" + $( this ).attr( "id" ) );
		}
		if ( location.href.indexOf( "&" + $( this ).attr( "id" ) ) == -1 && location.href.indexOf( "#" + $( this ).attr( "id" ) ) == -1 ) {
			location.href = location.href + ( location.href.indexOf( "#" ) == -1 ? "#" : "&" ) + $( this ).attr( "id" );
		}
		$( this ).show().dialog( $.extend( {
			"autoOpen" : true ,
			"modal" : true ,
			"position" : "top" ,
			"width" : $( window ).width() ,
			"height" : $( window ).height() ,
			"close" : function () {
				$( "body" ).removeClass( "body_pop" );
				if ( removeYn ) $( this ).remove();
				document.body.scrollTop = scrollHeight;
				if ( $( this ).attr( "closeCall" ) != "true" ) {
					history.back();
				}
			} ,
			"create" : function () {
				comm.bindEvent( $( this ) );
				$( "body" ).addClass( "body_pop" );
				$( ".ui-dialog" ).css( "top" ,"0" );
				$( this ).find( "a" ).not( ".FILE_DOWNLOAD,.LAYOUT_CLOSE_BTN,.ui-tabs-anchor" ).addClass( "NATEVE_OPEN" );
			} ,
			"dialogClass" : "syworksDialog" ,
			"draggable" : false
		} ,params ) );
	};
} )( jQuery );
/**
 * 문자열을 3자리에 맞추어 콤마 예를들면 1000 => 1,000
 */
( function ( $ ) {
	$.fn.numberFormat = function () {
		var number_format = function ( vals ) {
			var input = String( vals );
			var reg = /(\-?\d+)(\d{3})($|\.\d+)/;
			if ( reg.test( input ) ) {
				return input.replace( reg ,function ( str ,p1 ,p2 ,p3 ) {
					return number_format( p1 ) + "," + p2 + "" + p3;
				} );
			} else {
				return input;
			}
		}
		$( this ).each( function () {
			if ( $( this ).is( "input" ) || $( this ).is( "textarea" ) ) {
				$( this ).val( number_format( $( this ).val() ) );
			} else {
				$( this ).text( number_format( $( this ).text() ) );
			}
		} );
	};
} )( jQuery );
/**
 * 전화번호 형태로 변환한다.
 */
( function ( $ ) {
	$.fn.telFormat = function () {
		$( this ).val( $( this ).val().replace( /^(02.{0}|^01.{1}|[0-9]{3})(\-)?([0-9]+)(\-)?([0-9]{4})/ ,"$1-$3-$5" ) );
	};
} )( jQuery );
function setReportOption ( file ,options ) {
	if ( options == undefined ) {
		options = {};
	}
	if ( options.iframe == undefined ) {
		options.popup = true;
	}
	// option에 reb파일명과 permission,pageAttribute를 추가한다.
	if ( !options.hasOwnProperty( "file" ) ) {
		options.file = file;
	}
	if ( !options.hasOwnProperty( "permission" ) ) {
		options.permission = comm.permission;
	}
	if ( !options.hasOwnProperty( "pageAttribute" ) ) {
		options.pageAttribute = comm.pageAttribute;
	}
	reportOption = options;
}
var reportFile;
var reportOption;
$.cookie.json = true;
$.openReport = function ( file ,options ) {
	setReportOption( file ,options );
	$.exportReport();
};
$.exportReport = function ( isDownload ,file ,options ) {
	if ( options != undefined ) {
		setReportOption( file ,options );
	}
	if ( reportOption == null ) {
		alert( "생성된 레포트가 없습니다. 먼저 레포트를 출력하십시오." );
		return;
	}
	var $form = $( "<form>" ,{
		method : "get"
	} );
	$form.append( $( "<input>" ,{
		type : "hidden" ,
		name : "file" ,
		value : reportOption.file
	} ) );
	$form.append( $( "<input>" ,{
		type : "hidden" ,
		name : "exportType" ,
		value : reportOption.exportType
	} ) );
	$form.append( $( "<input>" ,{
		type : "hidden" ,
		name : "excelExportSheetOption" ,
		value : reportOption.excelExportSheetOption
	} ) );
	if ( reportOption.params != undefined ) {
		$.each( reportOption.params ,function ( key ,value ) {
			$form.append( $( "<input>" ,{
				type : "hidden" ,
				name : "names" ,
				value : key
			} ) );
			$form.append( $( "<input>" ,{
				type : "hidden" ,
				name : "values" ,
				value : value
			} ) );
		} );
	};
	$form.append( $( "<input>" ,{
		type : "hidden" ,
		name : "fileNm" ,
		value : ( reportOption.params.TITLE_NM ? reportOption.params.TITLE_NM : "download" ) + ".pdf"
	} ) );
	$form.attr( "action" ,"comm/syst/util/report/download.do" ).appendTo( "body" ).submit().remove();
}