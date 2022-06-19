const {MongoClient, ServerApiVersion} = require('mongodb');

module.exports = MongoClient.connect('mongodb+srv://root:root@telegram.8se3b.mongodb.net/?retryWrites=true&w=majority')