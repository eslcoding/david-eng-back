




const MongoClient = require('mongodb').MongoClient;

// const config = require('../config')

module.exports = {
    getCollection
}

// Database Name
const dbName = 'davideng_db';

var dbConn = null;

async function getCollection(collectionName) {
    const db = await connect()
    return db.collection(collectionName);
}

async function connect() {
    // mongodb+srv://eslcoding:<password>@cluster0.r0pfj.mongodb.net/test
    // const url = 'mongodb+srv://eslcoding:Coding11@cluster0.r0pfj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
    const url = 'mongodb+srv://eslcoding:Coding11@cluster0.r0pfj.mongodb.net/test'
    if (dbConn) return dbConn;
    try {
        const client = await MongoClient.connect(url, { useUnifiedTopology: true, useNewUrlParser: true });
        const db = client.db(dbName);
        dbConn = db;
        return db;
    } catch (err) {
        console.log('Cannot Connect to DB', err)
        throw err;
    }
}




