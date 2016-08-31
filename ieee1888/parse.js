var xml2js  = require('xml2js');
var parser = require('xml2json');


//xml2jsがns使えないのでparse前にnamespaceを取るメソッド
function deleteNS(data){
	//var regExp=RegExp(/:/g)
	data=data.replace(/<[a-zA-Z0-9]*:/g,"<");
	data=data.replace(/<\/[a-zA-Z0-9]*:/g,"<\/");
	data=data.replace(/<\/Envelope>null/g,"<\/Envelope>");
	return data
}

//xmlj2sで作ったxmlがエラーを吐くので修正してみる
function deleteSpace(data){
	data=data.replace(/[\n\r]/g,"");
	data=data.replace(/\s\s+/g,"");
	return data;
}

exports.parseWrite=function(data){
	//xml2jsがns使えないのでparse前にnamespaceを取る
	//console.log(data)
	data=deleteNS(data)
		
	//jsonに変換
	var json = JSON.parse(parser.toJson(data));
	point=json["Envelope"]["Body"]["dataRQ"]["transport"]["body"]["point"];
	//pointが１つかどうか、
	if(point["id"]==undefined){
		for(var i in point){
			checkPoint(point[i]);
		}
	}else{
		checkPoint(point);
	}
	return "aa";
}

//parseWriteから呼ばれる関数
function checkPoint(point){

	//pointに対して、valueが１つ、かつ、timeがない場合
	if (typeof point["value"]=="string"){
		//時間を生成
		checkValue(point["id"],null,point["value"]);
	}else{
		//valueがひとつしかないのか、複数あるのか。ちなみにvalueが複数ある場合はtimeが必須という前提
		if(point["value"]["time"]==undefined){	
			for (var x in point["value"]){
					checkValue(point["id"],point["value"][x]["time"],point["value"][x]["$t"]);		
			}
		}else{
			checkValue(point["id"],point["value"]["time"],point["value"]["$t"]);
		}	
	}
		
}
//parseWriteから呼ばれる関数
function checkValue(point,time,val){
	console.log("point="+point);
	console.log("time="+time);
	console.log("val="+val);

}

//writeに対するok(暫定)
exports.makeOk=function(){
	
	var builder = new xml2js.Builder({ rootName : 'soapenv:Envelope'});
	var header={"OK":""};
	var transport={"header":header,$:{'xmlns':"http://gutp.jp/fiap/2009/11/"}};
	var dataRS={"transport":transport,$:{'xmlns:ns2':"http://soap.fiap.org/"}};

	var body={"ns2:dataRS":dataRS};
	var root = {"soapenv:Body":body,$:{"xmlns:soapenv":"http://schemas.xmlsoap.org/soap/envelope/"}};
	var xml = builder.buildObject(root);
	var str=deleteSpace(xml.toString());
	return str;
}

