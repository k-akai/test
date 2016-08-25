var express = require('express');
var router = express.Router();
var xml2js  = require('xml2js');
//var ieee1888make =require('../ieee1888/make.js');
var ieee1888=require('../ieee1888/parse.js');

/* GET users listing. */
router.get('/', function(req, res, next) {

	res.send('respond with a resource');
});

router.post('/',function(req, res){
	var data="";
	req.on('readable',function(chunk){
		data+=req.read();
	});

	req.on('end',function(){
		//console.log(data);
		ieee1888.parseWrite(data);
		//xml=ieee1888make.parseWrite(data);

		xml=ieee1888.makeOk();
		console.log(xml);
		res.send(xml);

	});


});


	


module.exports = router;
