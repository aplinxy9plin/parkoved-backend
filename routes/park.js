var express = require('express');
var router = express.Router();
var { MongoClient, ObjectID } = require("mongodb")
var { MONGO_URI, DB_NAME } = require("../config")
const path = require('path');
const fs = require('fs');
var stringSimilarity = require('string-similarity');
var fetch = require('node-fetch');

router.get('/getall', (req, res) => {
  MongoClient.connect(MONGO_URI, (err, db) => {
    if(err) throw err
    var dbo = db.db(DB_NAME)
    dbo.collection('parks').find().toArray((err, result) => {
      if(err) throw err;
      db.close()
      res.json({ type: 'ok', result: result.map((item) => {
        return {
          id: item._id,
          name: item.park_name
        }
      }) })
    })
  })
})

router.get('/getImages/:id', (req, res, next) => {
  if(ObjectID.isValid(req.params.id)){
    MongoClient.connect(MONGO_URI, (err, db) => {
      if(err) throw err
      var dbo = db.db(DB_NAME)
      dbo.collection('items').findOne({ _id: ObjectID(req.params.id) }, (err, result) => {
        if(err) throw err;
        if(result){
          db.close()
          res.json({ type: 'ok', result: result.images})
        }else{
          db.close()
          res.json({ type: 'bad_params' })
        }
      })
    })
  }else{
    res.json({ type: 'bad_params' })
  }
})

router.get('/getItems/:id', (req, res, next) => {
  if(ObjectID.isValid(req.params.id)){
    MongoClient.connect(MONGO_URI, (err, db) => {
      if(err) throw err
      var dbo = db.db(DB_NAME)
      dbo.collection('items').find({ park_id: req.params.id }).toArray((err, result) => {
        if(err) throw err;
        if(result){
          db.close()
          res.json({ type: 'ok', result: result.map((item) => {
            delete item.images
            return item
          }) })
        }else{
          db.close()
          res.json({ type: 'bad_params' })
        }
      })
    })
  }else{
    res.json({ type: 'bad_params' })
  }
})

router.get('/getItem/:id', (req, res, next) => {
  if(ObjectID.isValid(req.params.id)){
    MongoClient.connect(MONGO_URI, (err, db) => {
      if(err) throw err
      var dbo = db.db(DB_NAME)
      dbo.collection('items').findOne({ _id: ObjectID(req.params.id) }, (err, result) => {
        if(result){
          db.close()
          res.json({ type: 'ok', result })
        }else{
          db.close()
          res.json({ type: 'bad_params' })
        }
      })
    })
  }else{
    res.json({ type: 'bad_params' })
  }
})

router.get('/get/:id', (req, res, next) => {
  if(ObjectID.isValid(req.params.id)){
    MongoClient.connect(MONGO_URI, (err, db) => {
      if(err) throw err
      var dbo = db.db(DB_NAME)
      dbo.collection('parks').findOne({ _id: ObjectID(req.params.id) }, (err, result) => {
        if(result){
          db.close()
          res.json({ type: 'ok', result })
        }else{
          db.close()
          res.json({ type: 'bad_params' })
        }
      })
    })
  }else{
    res.json({ type: 'bad_params' })
  }
})

router.post('/login', function(req, res, next) {
  if(req.body.email && req.body.password){
    MongoClient.connect(MONGO_URI, (err, db) => {
      if(err) throw err;
      var dbo = db.db(DB_NAME)
      dbo.collection("parks").findOne({ email: req.body.email, password: req.body.password }, (err, result) => {
        if(err) throw err;
        if(!result){
          db.close()
          res.json({ type: 'bad_password' })
        }else{
          db.close()
          res.json({ type: 'ok', result })
        }
      })
    })
  }else{
    res.json({ type: 'err' })
  }
});

router.post('/add', function(req, res, next) {
  if(req.body.email && req.body.password){
    MongoClient.connect(MONGO_URI, (err, db) => {
      if(err) throw err;
      var dbo = db.db(DB_NAME)
      dbo.collection("parks").findOne({ email: req.body.email }, (err, result) => {
        if(err) throw err;
        if(!result){
          dbo.collection("parks").insertOne(req.body, (err, insertResult) => {
            if(err) throw err;
            db.close()
            res.json({ type: 'ok', id: insertResult["ops"][0]["_id"] })
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
      dbo.collection("parks").findOne({ _id: ObjectID(req.body.park_id) }, (err, result) => {
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

router.post('/addEvent', function(req, res, next) {
  if(req.body.park_id){
    MongoClient.connect(MONGO_URI, (err, db) => {
      if(err) throw err;
      var dbo = db.db(DB_NAME)
      dbo.collection("events").insertOne(req.body, (err) => {
        if(err) throw err;
        dbo.collection("users").find({}).toArray((err, users) => {
          if(err) throw err;
          users.forEach((user) => {
            fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ "to": user.device_id, "title":req.body.name, "body": req.body.description })
            });
          })
          db.close()
          res.json({ type: 'ok' })
        })
      })
    })
  }else{
    res.json({ type: 'err' })
  }
});

router.get('/getEvents', (req, res, next) => {
  MongoClient.connect(MONGO_URI, (err, db) => {
    if(err) throw err
    var dbo = db.db(DB_NAME)
    dbo.collection('events').find({}).toArray((err, result) => {
      if(err) throw err;
      db.close()
      res.json({ type: 'ok', result })
    })
  })
})

router.get('/iconList', (req, res, next) => {
  const { search } = req.query
  if(search){
    fs.readdir(
      path.resolve(__dirname, '../icons'),
      (err, files) => {
        if (err) throw err;
        var result = stringSimilarity.findBestMatch(search, 
          files.map((item) => String(item.split(".")[0]))
        ).ratings.sort((a, b) => b.rating-a.rating).map((item) => "http://192.168.43.113:3000/icons/"+encodeURI(item.target)+".png").slice(0,9)
        res.json({ type: 'ok', result })
      }
    );
  }else{
    res.json({ type: 'search is empty' })
  }
})



module.exports = router;
