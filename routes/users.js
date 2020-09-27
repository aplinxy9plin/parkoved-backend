const { Router } = require('express');
var express = require('express');
var router = express.Router();
var { MongoClient, ObjectID } = require("mongodb")
var { MONGO_URI, DB_NAME } = require("../config")

router.post('/add', function(req, res, next) {
  if(req.body.name && req.body.device_id && req.body.age){
    MongoClient.connect(MONGO_URI, (err, db) => {
      if(err) throw err
      var dbo = db.db(DB_NAME)
      dbo.collection("users").insertOne({
        reg_date: new Date(),
        name: req.body.name,
        device_id: req.body.device_id,
        age: req.body.age,
        money: 0,
        pays: [],
        avatar: req.body.avatar
      }, (err, insertResult) => {
        if(err) throw err
        db.close()
        res.json({ type: 'ok', id: insertResult["ops"][0]["_id"] })
      })
    })
  }else{
    res.status(500).json({ type: 'bad_params' })
  }
});

router.get('/get', function(req, res, next) {
  if(ObjectID.isValid(req.query.user_id)){
    MongoClient.connect(MONGO_URI, (err, db) => {
      if(err) throw err
      var dbo = db.db(DB_NAME)
      dbo.collection("users").findOne({ _id: ObjectID(req.query.user_id) }, (err, result) => {
        if(err) throw err
        if(result){
          db.close()
          res.json({ type: 'ok', result })
        }else{
          db.close()
          res.json({ type: 'bad_user' })
        }
      })
    })
  }else{
    res.status(500).json({ type: 'bad_params' })
  }
});

router.get('/mostage', function(req, res, next) {
  MongoClient.connect(MONGO_URI, (err, db) => {
    if(err) throw err
    var dbo = db.db(DB_NAME)
    dbo.collection("users").find().toArray((err, result) => {
      if(err) throw err
      const ages = compressArray(result.map((item) => item.age)).slice(0, 3)
      res.json({ type: 'ok', result: ages })
    })
  })
});

function compressArray(original) {
 
	var compressed = [];
	// make a copy of the input array
	var copy = original.slice(0);
 
	// first loop goes over every element
	for (var i = 0; i < original.length; i++) {
 
		var myCount = 0;	
		// loop over every element in the copy and see if it's the same
		for (var w = 0; w < copy.length; w++) {
			if (original[i] == copy[w]) {
				// increase amount of times duplicate is found
				myCount++;
				// sets item to undefined
				delete copy[w];
			}
		}
 
		if (myCount > 0) {
			var a = new Object();
			a.value = original[i];
			a.count = myCount;
			compressed.push(a);
		}
	}
 
	return compressed;
};

module.exports = router;
