var faker = require('faker');
faker.locale = "ru";
var { MongoClient, ObjectID } = require("mongodb")
var { MONGO_URI, DB_NAME, TG_TOKEN, managerId } = require("./config");

(async () => {
    var db = await MongoClient.connect(MONGO_URI)
    var dbo = db.db(DB_NAME)
    var usersCol = dbo.collection("users")
    for (let i = 0; i < 1000; i++) {
        var obj = {
            name: faker.name.findName(),
            age: Math.floor(Math.random() * (40 - 17) + 17),
            date: faker.date.past(),
            phone: faker.phone.phoneNumber(),
            pays: [],
            money: 20000
        }
        console.log(obj)
        const insUser = await usersCol.insertOne(obj)
        const user_id = insUser["ops"][0]["_id"]
        for (let j = 0; j < (Math.floor(Math.random() * (20 - 1) + 1)); j++) {
            var itemsCol = dbo.collection("items")
            var items = await itemsCol.find({}).toArray()
            const index = (Math.floor(Math.random() * (items.length-1 - 0) + 0))
            console.log(index)
            var newpay = {
                date: faker.date.past(),
                price: items[index].prices.child,
                user_id
            }
            items[index].pays.push(newpay)
            await itemsCol.updateOne({ _id: items[index]._id }, {
                $set: { pays: items[index].pays }
            })
            var userscol1 = dbo.collection("users")
            var user1 = await userscol1.findOne({_id: user_id})
            user1.pays.push(newpay)
            user1.money -= items[index].prices.child
            await userscol1.updateOne({ _id: items[index]._id }, {
                $set: { pays: user1.pays, money: user1.money }
            })
        }
    }
    db.close()
})()