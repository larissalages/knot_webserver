const express = require('express');
const app = express();
const bodyParser= require('body-parser')
var MeshbluSocketIO = require("meshblu");
const MongoClient = require('mongodb').MongoClient

app.use(bodyParser.urlencoded({extended: true}))

var meshblu = new MeshbluSocketIO({
  resolveSvr: false,
  hostname: "knot-test.cesar.org.br",
  port: 3000,
  uuid: "",
  token: "",
  protocol: "ws"
});
var responses = {};

meshblu.on("ready", function(response) {
  console.log("meshblu ready")
  if (!meshblu.uuid) {
    meshblu.uuid = response.uuid;
    meshblu.token = response.token;
  }
  const uuid = response.uuid;
  if (responses[uuid]) {
    responses[uuid].forEach((info, i) => {
      //you can pass a list of uuids instead  e.g. { gateways: ["uud1","uuid2"] }
      meshblu.devices({ gateways: ["*"] }, function(response) {
        info.res.send(response);
        delete responses[uuid][i];
      });
    });
  }
});

meshblu.on("notReady", function(response) {
  const uuid = response.uuid;
  if (responses[uuid]) {
    responses[uuid].forEach((info, i) => {
      info.res.send(response);
      delete responses[uuid][i];
    });
  }
});

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
  const uuid = req.body.uuid;
  const token = req.body.token;
  const gateway = req.body.gateway;
  const hostname = req.body.hostname;
  const port = req.body.port;

  if (uuid === "" || token === "" || gateway === "")
    res.send({ status: "Please provide all required values." });
  meshblu["_options"].hostname = hostname;
  meshblu["_options"].port = port;
  meshblu["_options"].uuid = uuid;
  meshblu["_options"].token = token;


  if (responses[uuid]) {
    responses[uuid].push({ res, gateway });
  } else {
    responses[uuid] = [{ res, gateway }];
  }
  meshblu.connect();
})