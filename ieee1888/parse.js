var xml2js  = require('xml2js');
var parser = require('xml2json');
//xml2jsがns使えないのでparse前にnamespaceを取る
function deleteNS(data){
	//var regExp=RegExp(/:/g)
	data=data.replace(/<[a-zA-Z0-9]*:/g,"<")
	data=data.replace(/<\/[a-zA-Z0-9]*:/g,"<\/")
	data=data.replace(/<\/Envelope>null/g,"<\/Envelope>")
	return data
}

exports.parseWrite=function(data){

	data=deleteNS(data)
	console.log(data)
	var json = parser.toJson(data);
	console.log(json);
	/*
	var parseString=xml2js.parseString;

	//var data = "<root>Hello xml2js!</root>"
	parseString(data,function(err, result){
		if(err) {
			console.log(err);
		} else {
			//console.log(result);
			//console.log(result['Envelope']);
			console.log(result);
			console.log(result['Envelope']);
			dataRQ=result['Envelope']['Body'];
			//bo=dataRQ'dataRQ';
			//console.log(bo);
			//console.log(result.root.hoge1[0]);		// 配列になってる
			//console.log(result.root.hoge2[0]);		// 配列になってる
		}
	});
	*/
	return "a";
}

exports.makeOk=function(){
	
	var builder = new xml2js.Builder({ rootName : 'soapenv:Envelope'});
	var header={"OK":""};
	var transport={"header":header,$:{'xmlns':"http://gutp.jp/fiap/2009/11/"}};
	var dataRS={"transport":transport,$:{'xmlns:ns2':"http://soap.fiap.org/"}};

	var body={"ns2:dataRS":dataRS};
	var root = {"soapenv:Body":body,$:{"xmlns:soapenv":"http://schemas.xmlsoap.org/soap/envelope/"}};
	var xml = builder.buildObject(root);
	return xml.toString();

}
	//res.send('<?xml version=\'1.0\' encoding=\'UTF-8\'?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><ns2:dataRS xmlns:ns2="http://soap.fiap.org/"><transport xmlns="http://gutp.jp/fiap/2009/11/"><header><OK /></header></transport></ns2:dataRS></soapenv:Body></soapenv:Envelope>')

