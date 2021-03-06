var xml2js  = require('xml2js');
var parser = require('xml2json');
//var db = require('../storage/connection');
//var fetch = require('../storage/fetch');
var share=require('../lib/share.js');
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


//fetchの解析
exports.parseFetch=function(data){
	//xml2jsがns使えないのでparse前にnamespaceを取る

	data=deleteNS(data);
	//jsonに変換
	var json = JSON.parse(parser.toJson(data));
		
	query=json["Envelope"]["Body"]["queryRQ"]["transport"]["header"]["query"];
	
	retdata={};
		
	retdata.id=query["id"];
	retdata.type=query["type"];
	if (query["acceptableSize"]!=undefined){
		retdata.acceptableSize=query["acceptableSize"];
	}
	retdata.keys=null;
	//queryが１つかどうか,1つであっても複数であっても配列にほり込む
	if(isArray(query["key"])){
		
		
		retdata.keys=query["key"];
	}else{
		pushkey=[];
		//console.log("通過");
		var attrs=Object.keys(query["key"]);
		obs={};		
		for( var i in attrs){
			
			var namekey=attrs[i];
			obs[namekey]=query["key"][namekey];
		}
		pushkey.push(obs);
		retdata.keys=pushkey;	

	}
	
	return retdata;
}
function isArray(o){
  return Object.prototype.toString.call(o) === '[object Array]';
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
	//console.log("point="+point);
	//console.log("time="+time);
	//console.log("val="+val);

	//時間を変換する
	date=null;
	if (time==null){
		date=new Date();
	}else{
		//解析する
				
		date=new Date(time);
	}
	//console.log("new Date="+date);
	doc = {
		    "point" : point,
		    "time" : date,
		    "value" : val
	};

	var db=require('../storage/ieee1888.js');
	
	db.writeAndView(doc);

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

//fetchデータを検索してresponse
exports.makeFetchResonse=function(data,res){
	var db=require('../storage/ieee1888.js');
	db.fetchSearchAndPush(res,data,fetchResponse);
}


var fetchResponse=function(err,docs,res,data){

	var xml="";
	xml+="<?xml version='1.0' encoding='UTF-8'?>"
	xml+='<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><ns2:queryRS xmlns:ns2="http://soap.fiap.org/"><transport xmlns="http://gutp.jp/fiap/2009/11/"><header>';
	if(docs.length==0){
		xml+='<error type="POINT_NOT_FOUND">no point</error>';
	}else{
		xml+='<OK />';
	}
	xml+='<query id="'+data.id+'" type="'+ data.type+'"';
	var size=0;
	if(data.acceptableSize!=undefined){
		xml+=' acceptableSize="'+data.acceptableSize+'"';
		size=parseInt(data.acceptableSize);
	}
	xml+='>';
	
	for (var i in data["keys"]){
		xml+='<key ';
		var attrs=Object.keys(data["keys"][i]);
		
		for (var j in attrs){
			var x=attrs[j];
			xml+=x+'="'+data["keys"][i][x]+'"';
		}
		xml+='/>';
	}
	xml+="</query></header>";
	
	checkpoint="";
	if(docs.length!=0){
		xml+="<body>";
		for (var i in docs){
			if(size!=0&&i>=size){
				break;
			}
			times=docs[i]["time"].toISOString();
			times=times.replace(/Z/g,"+00:00");
			

			if(docs[i]["point"]!=checkpoint){
				if(checkpoint!=""){
					xml+="</point>";
				}

				checkpoint=docs[i]["point"];
				xml+='<point id="'+docs[i]["point"]+'">';
			}
			xml+='<value time="'+times+'">'+docs[i]["value"]+"</value>";		
		}
		xml+="</point></body>";
	}
	xml+="</transport></ns2:queryRS></soapenv:Body></soapenv:Envelope>";
	
	res.send(xml);
}




/*perser版、作りかけ、あまりにライブラリがしょぼいので現状あきらめ
exports.makeFetchResonse=function(){
	var builder = new xml2js.Builder({ rootName : 'soapenv:Envelope'});

	var key={"id":"7574065b-d493-41d3-8e6a-9163d0522b41"};
	var query={"query":key,$:{"id":"7574065b-d493-41d3-8e6a-9163d0522b41"}};
	var header={"OK":"","query":query};
	var transport={"header":header,$:{'xmlns':"http://gutp.jp/fiap/2009/11/"}};

	var queryRS={"transport":transport,$:{'xmlns:ns2':"http://soap.fiap.org/"}};	

	var body={"ns2:queryRS":queryRS};
	
	var root = {"soapenv:Body":body,$:{"xmlns:soapenv":"http://schemas.xmlsoap.org/soap/envelope/"}};
	var xml = builder.buildObject(root);
	var str=deleteSpace(xml.toString());
	return str;
}
*/
