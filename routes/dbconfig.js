var express = require('express');
var router = express.Router();
//var fetch = require('../storage/fetch.js');
var ieee1888db=require('../storage/ieee1888.js');
var db=require('../storage/dbutil.js');
var share=require('../lib/share.js');
/* GET users listing. */
var id=0;
router.get('/', function(req, res, next) {
	
	if(req.query.db=="ieee1888"){
		if(req.query.control=="clear"){
			console.log("clear-db making");
			db.clear(share.ieee1888collection);
			data=ieee1888db.pushSocket();
			res.render('db.html', { 
				title:"DB",
				id:id,
				host:process.env.HOSTNAME+"/dbsocket",
			        tabledata:[],
			});
			
		}else if(req.query.control="view"){
			data=ieee1888db.allReadandResponse(res,++id);
		}else{
			res.send('controlを指定');
		}
	}else if(req.query.db=="line"){
	
		if(req.query.control=="clear"){
			console.log("clear-db line");
			db.clear(share.linec);
			res.send("line dbをクリアしました");			
		}else if(req.query.control=="init"){
			console.log("set-db-init line");
		}	
	}else{
		res.send('未実装です');
	}

	
});

router.post('/',function(req, res){
	res.send('respond with a resource');
	
});


module.exports = router;
