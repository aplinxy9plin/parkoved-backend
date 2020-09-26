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


module.exports = router;
