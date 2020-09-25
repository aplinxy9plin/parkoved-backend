var express = require('express');
var router = express.Router();
var { MongoClient } = require("mongodb")
var { MONGO_URI, DB_NAME } = require("../config")

router.post('/add', function(req, res, next) {
  if(req.body.email && req.body.password){
    MongoClient.connect(MONGO_URI, (err, db) => {
      if(err) throw err;
      var dbo = db.db(DB_NAME)
      dbo.collection("parks").findOne({ email: req.body.email }, (err, result) => {
        if(err) throw err;
        if(!result){
          dbo.collection("parks").insertOne(req.body, (err, inserResult) => {
            if(err) throw err;
            db.close()
            res.json({ type: 'ok', id: inserResult["ops"][0]["_id"] })
          })
        }else{
          db.close()
          res.json({ type: 'just_add' })
        }
      })
    })
  }else{
    res.json({ type: 'err' })
  }
});

router.post('/addItem', function(req, res, next) {
  if(req.body.park_id){
    MongoClient.connect(MONGO_URI, (err, db) => {
      if(err) throw err;
      var dbo = db.db(DB_NAME)
      dbo.collection("parks").findOne({ park_id: req.body.park_id }, (err, result) => {
        if(err) throw err;
        if(result){
          dbo.collection("items").insertOne(req.body, (err, inserResult) => {
            if(err) throw err;
            res.json({ type: 'ok', id: inserResult["ops"][0]["_id"] })
          })
        }else{
          db.close()
          res.json({ type: 'bad_park' })
        }
      })
    })
  }else{
    res.json({ type: 'err' })
  }
});


module.exports = router;
