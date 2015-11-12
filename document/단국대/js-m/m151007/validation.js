var error="#_error_";
$.extend($.validator,{
	messages:{
		ext:$.validator.format("허용된 업로드 파일이 아닙니다. 업로드 가능한 확장자는 [{0}] 입니다."),
		rrn:"올바른 주민등록번호형식이 아닙니다."
	}
});
$.validator.setDefaults({
	debug:false,
	ignore:"input:hidden",
	onkeyup:false,
	onclick:false,
	onfocusout:false,
	showErrors:function(messages,elements){
		$(":input",this.currentForm).parent().removeClass("form_invalid");
		if(elements.length>0){
			var messageType=$(this.currentForm).data("message");
			var messageMap=new Map();
			var index=0;
			$.each(messages,function(name,message){
				$(elements[index++].element).parent().addClass("form_invalid");
				// 동일한 에러 메시지 filtering
				var errorKey=(name.indexOf(".")>-1)?name.split(".")[1]:name;
				if(!messageMap.containsKey(errorKey)){
					messageMap.put(errorKey,message);
				}
			});
			var alertMessages="";
			$.each(messageMap.values(),function(index,message){
				alertMessages+=message+"\n";
			});
			alert(alertMessages);
		}
	}
});
$.fn.addRules=function(options){
	this.each(function(){
		$(this).rules("add",options);
	});
};
$.validator.addMethod("ext",function(value,element,param){
	var valid=false;
	var uploadExtension=value.split(".").pop().toLowerCase();
	if(value!=""&&uploadExtension){
		$.each(param.split(", "),function(index,allowedExtension){
			if($.trim(uploadExtension)==$.trim(allowedExtension)){
				valid=true;
				return false;
			}
		});
	}else{
		valid=true;
	}
	return valid;
});
$.validator.addMethod("rrn",function(value,element,params){
	if($.isArray(params)){
		for(var i=0;i<params.length;i++){
			value+=$(params[i]).val();
		}
	}
	value=value.replace(/-/g,"");
	if(value.length!=13){ return false; }
	var tempGbCd=value.substr(7,1);
	if(tempGbCd=="A"||tempGbCd=="B"){ return true; }
	var sum=0;
	if(this.optional(element)||value.match(/\d{2}[0-1]\d{1}[0-3]\d{1}\d{7}/)){
		if(value.substr(6,1)>=5&&value.substr(6,1)<=8){ // 외국인
			if(Number(value.substr(7,2))%2!=0) return false;
			for(var i=0;i<12;i++){
				sum+=Number(value.substr(i,1))*((i%8)+2);
			}
			if((((11-(sum%11))%10+2)%10)==Number(value.substr(12,1))){ return true; }
			return false;
		}else{ // 내국인
			for(var i=0;i<12;i++){
				sum+=Number(value.substr(i,1))*((i%8)+2);
			}
			if(((11-(sum%11))%10)==Number(value.substr(12,1))){ return true; }
			return false;
		}
	}else{
		return false;
	}
});
/**
 * 필수입력 미입력 안내 내용을 초기화 시키후 숨긴고, invalid class가 추가된 것들을 없애준다.
 */
$.resetInvalid=function(){
	$(".lst_square").empty();
	$(".section_required").hide();
	$(".form_invalid").each(function(index){
		$(this).removeClass("form_invalid");
	});
};
function getAllowedExtensions(){
	var allowedExtensions="";
	$.ajax({
		url:"comm/syst/file/findUploadConst.do",
		type:"get",
		dataType:"json",
		async:false
	}).done(function(data){
		// console.log(data.uploadConst.extention);
		allowedExtensions=data.uploadConst.extention;
	}).fail(function(xhr,textStatus,errorThrown){});
	return allowedExtensions;
}
$.validator.addMethod("domain",function(value,element){
	return this.optional(element)||/^((http(s?))\:\/\/)([0-9a-zA-Z\-]+\.)+[a-zA-Z]{2,6}(\:[0-9]+)?(\/\S*)?$/.test(value);
},"도메인형태(http://또는https://)로 작성하세요.");
$.validator.addMethod("tel",function(value,element){
	return this.optional(element)||/^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/.test(value);
},"전화번호 형식으로 작성하세요.");