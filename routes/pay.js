const { Router } = require('express');
var express = require('express');
var router = express.Router();
var { MongoClient, ObjectID } = require("mongodb")
var { MONGO_URI, DB_NAME, TG_TOKEN, managerId } = require("../config");
const { route } = require('./park');
const { Telegraf } = require('telegraf')
const bot = new Telegraf(TG_TOKEN)

router.post('/up', function(req, res, next) {
  if(req.body.id){
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
                    dbo.collection("users").findOne({ _id: ObjectID(req.body.user_id)}, (err, user) => {
                        if(err) throw err;
                        user.money -= req.body.money
                        user.pays.push({
                            date: new Date(),
                            price: req.body.money,
                            name: item.name
                        })
                        dbo.collection("users").updateOne({ _id: ObjectID(req.body.user_id) }, {
                            $set: {
                                money: user.money,
                                pays: user.pays
                            }
                        }, (err) => {
                            dbo.collection("users").findOne({ _id: ObjectID(req.body.user_id)}, (err, newuser) => {
                                db.close()
                                var RandomNumber = Math.ceil(Math.random() * 9999);              
                                bot.telegram.sendMessage(managerId, `Успешная оплата.\nКод: ${RandomNumber}`)
                                res.json({ type: 'ok', result: newuser, code: RandomNumber })
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

// bot.command('/checklist', (ctx) => ctx.reply('test'))

bot.launch()

module.exports = router;
