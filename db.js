const {MongoClient} = require('mongodb');

module.exports = MongoClient.connect('mongodb+srv://root:root@dev.ascnr.mongodb.net/telegram?retryWrites=true&w=majority')