const express = require('express');
const app = express();
const bodyParser= require('body-parser')

const MongoClient = require('mongodb').MongoClient

app.use(bodyParser.urlencoded({extended: true}))

MongoClient.connect('mongodb://llo3:abc1234@ds139960.mlab.com:39960/knot_db', (err, client) => { //your MongoDB url
  if (err) return console.log(err)

  var db = client.db('knot_db') //name of your database

  app.listen(8081, () => {
    console.log('listening on 8081')
  })
})

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html')
})

app.post('/getDevices', (req, res) => {
  console.log(req.body)
})