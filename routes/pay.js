const { Router } = require('express');
var express = require('express');
var router = express.Router();
var { MongoClient, ObjectID } = require("mongodb")
var { MONGO_URI, DB_NAME } = require("../config");
const { route } = require('./park');

router.post('/up', function(req, res, next) {
  if(req.body.name && req.body.device_id && req.body.age){
    MongoClient.connect(MONGO_URI, (err, db) => {
      if(err) throw err
      var dbo = db.db(DB_NAME)
      dbo.collection("users").findOne({ _id: ObjectID(req.body.id) }, (err, user) => {
        if(err) throw err
        if(user){
            var money = user.money ? user.money : 0
            money += req.body.money
            dbo.collection("users").updateOne({ _id: ObjectID(req.body.id) }, {
                $set: {
                    money
                }
            }, (err) => {
                if(err) throw err
                db.close()
                res.json({ type: 'ok', money })
            })
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

router.post('/pay', (req, res) => {
    if(ObjectID.isValid(req.body.user_id) && ObjectID.isValid(req.body.item)){
        MongoClient.connect(MONGO_URI, (err, db) => {
            if(err) throw err
            var dbo = db.db(DB_NAME)
            dbo.collection("items").findOne({ _id: ObjectID(req.body.item) }, (err, item) => {
                if(err) throw err
                item.pays.push({
                    date: new Date(),
                    user_id: req.body.user_id,
                    price: req.body.money
                })
                dbo.collection("items").updateOne({ _id: ObjectID(req.body.item) }, {
                    $set: {
                        pays: item.pays
                    }
                }, () => {
                    dbo.collection("users").findOne({ _id: ObjectID(req.body.id)}, (err, user) => {
                        if(err) throw err;
                        user.money -= req.body.money
                        user.pays.push({
                            date: new Date(),
                            price: req.body.money,
                            name: item.name
                        })
                        dbo.collection("users").updateOne({ _id: ObjectID(req.body.id) }, {
                            $set: {
                                money: users.money,
                                pays: users.pays
                            }
                        }, (err) => {
                            dbo.collection("users").findOne({ _id: ObjectID(req.body.id)}, (err, newuser) => {
                                db.close()
                                res.json({ type: 'ok', result: newuser })
                            })
                        })
                    })
                })
            })
        })
    }else{
        res.json({ type: 'bad_params' })
    }
})

module.exports = router;
