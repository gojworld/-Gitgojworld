$( document ).ready( function () {
	/*
	 * common ----------------------------------------------------------
	 */

	//top button
	$("#wrap").filter(function(){
		var $body = $(document.body), //자주 사용하기에 캐시되게 변수에 넣어준다
		$top = '';

			$top=$('<div>') //div 를 만들고
			.addClass('btn_top') //top className을 주고
			.hide() //처음에는 숨겨둔다
			.click(function(){  // 클릭이 이벤트 할당
				$body.animate({ scrollTop: 0 }); //animation효과로 scollTop=0으로 이동
			})
			.appendTo($body); // body에 top을 넣는다

		//윈도우의 스크롤위치로 위로가기 버튼을 보여줘야기에 핸들러 작성
		$(window).scroll(function(){

			var y = $(this).scrollTop();

			if(y >= 100){
				$top.fadeIn();
			}else{
				$top.fadeOut();
				}
		});
	});

	// 네비게이션 제어 //0813 class명 수정
	$( ".btn_open_aside" ).click( function () {
		if ( $( "#sideFavMobList" ).is( ".changed" ) ) {
			location.reload();
		} else {
			$( ".aside" ).toggleClass( "on" );
			$( "body" ).toggleClass( "body_pop" );
		}
	} );
	// 탭
	/*
	 * sub ----------------------------------------------------------
	 */
	// 체크
	$( "body" ).on( "click" ,".list_check a" ,function () {
		$( ".list_check a" ).removeClass( "on" );
		$( this ).toggleClass( "on" );
	} );
	// 아코디언리스트
	$( ".list > li > a" ).click( function ( e ) {
		$( this ).parent( "li" ).toggleClass( "off" );
		e.preventDefault();
	} );
	$( ".lnb li" ).click( function () {
		$( ".lnb li a" ).removeClass( "on" );
		$( this ).find( "a" ).addClass( "on" );
		$( ".lnb" ).stop().animate( {
			scrollLeft : $( ".lnb" ).find( 'a.on' ).offset().left - 30 + $( '.lnb' ).scrollLeft()
		} ,400 );
	} );
	$( ".file_add" ).filter( function () {
		$( ".file_add" ).find( ".fake_file" ).bind( "change" ,function () {
			$( this ).parent().find( ".fake_val" ).val( my_val );
		} );
	} );
	$( "body" ).on( "click" ,".acc .acc_btn" ,function () {
		$( this ).parents( ".acc" ).toggleClass( "on" );
	} );
	//첨부파일 디자인
	$(".file_add").filter(function(){
		$(".file_add").find(".fake_file").bind("change", function() {
			var my_val = $(this).val().replace(/C:\\fakepath\\/i, '');
			$(this).parent().find(".fake_val").val(my_val);
		 });
	});
} );
