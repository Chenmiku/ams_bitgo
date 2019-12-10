// var MongoClient = require('mongodb').MongoClient;
// var url = "mongodb://localhost:27017/mydb";

// MongoClient.connect(url, function(err, db) {
//   if (err) throw err;
//   var dbo = db.db("mydb");
//   var myobj = { name: "Company Inc", address: "Highway 37" };
//   dbo.collection("customers").insertOne(myobj, function(err, res) {
//     if (err) throw err;
//     console.log("1 document inserted");
//     db.close();
//   });
// });

var cors = require('cors');
require('dotenv').config()

// connect mongodb
var express = require('express'),
  app = express(),
  port = process.env.Port || 3001
  mongoose = require('mongoose'),
  Addr = require('./db/models/addressModel'),
  bodyParser = require('body-parser');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://' + process.env.DBHost + '/' + process.env.DBName, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
.then(() => console.log("Connected to DB"))
.catch(err => console.error("Couldn't connect to DB"))

app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(bodyParser.json()); // support json encoded bodies
app.use(cors({ origin: '*' }));

// setting for cors
app.use(function(req, res, next){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE, HEAD');
  res.header('Access-Control-Allow-Headers', 'Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', false);
  next()
})

// routes
var addrRoutes = require('./routes/addressRoutes');
app.use('/api/' + process.env.Version + '/public/address', addrRoutes);

// middlewares
app.use(function(req, res) {
  res.status(404).send({url: req.originalUrl + ' not found'})
});

app.listen(3001)
console.log('API server started on: ' + port);