const express = require('express');
const app = express();
const bodyParser= require('body-parser')
var MeshbluSocketIO = require("meshblu");
const MongoClient = require('mongodb').MongoClient
var os = require('os');

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
var set_data = false
var set_config = false
var get_devices = false

meshblu.on("ready", function(response) {
  console.log("meshblu ready")

  if (!meshblu.uuid) {
    meshblu.uuid = response.uuid;
    meshblu.token = response.token;
  }
  const uuid = response.uuid;
  if (responses[uuid]) {
    if(set_data == true){  //SET DATA

      responses[uuid].forEach((info, i) => {
        var updateValues = {};
        if (info.itemData === "true") {
          updateValues = {
            uuid: info.thingUuid,
            set_data: [
              {
                sensor_id: parseInt(info.itemId),
                value: true
              }
            ]
          };
        } else if (info.itemData === "false") {
          updateValues = {
            uuid: info.thingUuid,
            set_data: [
              {
                sensor_id: parseInt(info.itemId),
                value: false
              }
            ]
          };
        } else {
          updateValues = {
            uuid: info.thingUuid,
            set_data: [
              {
                sensor_id: parseInt(info.itemId),
                value: parseInt(info.itemData)
              }
            ]
          };
        }
        meshblu.update(updateValues, function(response) {
          info.res.send(response);
          delete responses[uuid][i];
        });
      });
    }
    else if(set_config == true) {  //SET CONFIG

      responses[uuid].forEach((info, i) => {
        var updateValues = {
          uuid: info.thingUuid,
          config: [
            {
              sensor_id: parseInt(info.itemId),
              event_flags: parseInt(info.evtFlags),
              time_sec: parseInt(info.timeSec),
              lower_limit: parseInt(info.lowerLimit),
              upper_limit: parseInt(info.upperLimit)
            }
          ]
        };
        meshblu.update(updateValues, function(response) {
          info.res.send(response);
          delete responses[uuid][i];
          });
      });
    } 
    else{  //ELSE
      responses[uuid].forEach((info, i) => {
        //you can pass a list of uuids instead  e.g. { gateways: ["uud1","uuid2"] }
        meshblu.devices({ gateways: ["*"] }, function(response) {
          console.log(response)

          str_result = response;

          if(get_devices == true)
          {
            index = i+1
            str_result = "Device ID : " + index + "<br />"
            str_result = str_result+ "Name : " + JSON.stringify(response[0].name) + "<br />"
            str_result = str_result + "Type : " + JSON.stringify(response[0].type) + "<br />"
            str_result = str_result + "UUID : " + JSON.stringify(response[0].uuid) + "<br />"
            str_result = str_result + "Online : " + JSON.stringify(response[0].online) + "<br />"            
          }
          info.res.send(str_result);

          delete responses[uuid][i];
        });
      });
    }
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
  console.log("Get Device")
  set_data = false
  set_config = false
  get_devices = true

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

app.post('/getData',(req,res) => {
  console.log("Get Data")
  set_data = false
  set_config = false 
  get_devices = false

  const hostname = req.body.hostname;
  const port = req.body.port;
  const uuid = req.body.uuid;
  const token = req.body.token;
  const thingUuid = req.body.thingUuid;
  const itemId = req.body.itemId;

  if (uuid === "" || token === "" || thingUuid === "" || itemId === "")
    res.send({ status: "Please provide all required values." });
  meshblu["_options"].hostname = hostname;
  meshblu["_options"].port = port;
  meshblu["_options"].uuid = uuid;
  meshblu["_options"].token = token;

  if (responses[uuid]) {
    responses[uuid].push({ res, thingUuid, itemId });
  } else {
    responses[uuid] = [{ res, thingUuid, itemId }];
  }
  meshblu.connect();

})

app.post('/setData',(req,res) => {
  console.log("Set Data")
  set_data = true
  set_config = false
  get_devices = false

  const hostname = req.body.hostname;
  const port = req.body.port;
  const uuid = req.body.uuid;
  const token = req.body.token;
  const thingUuid = req.body.thingUuid;
  const itemId = req.body.itemId;
  const itemData = req.body.valueData;

  if (uuid === "" || token === "" || thingUuid === "" || itemId === ""
    || itemData === "")
    res.send({ status: "Please provide all required values." });

  meshblu["_options"].hostname = hostname;
  meshblu["_options"].port = port;
  meshblu["_options"].uuid = uuid;
  meshblu["_options"].token = token;

  if (responses[uuid]) {
    responses[uuid].push({ res, thingUuid, itemId, itemData });
  } else {
    responses[uuid] = [{ res, thingUuid, itemId, itemData }];
  }
  meshblu.connect();
})

app.post("/sendConfig", function(req, res, next) {
  console.log("Send Config")
  set_config = true
  set_data = false
  get_devices = false

  const hostname = req.body.hostname;
  const port = req.body.port;
  const uuid = req.body.uuid;
  const token = req.body.token;
  const thingUuid = req.body.thingUuid;
  const itemId = req.body.itemId;
  const evtFlags = req.body.evtFlags;
  const timeSec = req.body.timeSec;
  const lowerLimit = req.body.lowerLimit;
  const upperLimit = req.body.upperLimit;

  if (uuid === "" || token === "" || thingUuid === "" || itemId === "")
    res.send({ status: "Please provide all required values." });

  meshblu["_options"].hostname = hostname;
  meshblu["_options"].port = port;
  meshblu["_options"].uuid = uuid;
  meshblu["_options"].token = token;

  if (responses[uuid]) {
    responses[uuid].push({
      res,
      thingUuid,
      itemId,
      evtFlags,
      timeSec,
      lowerLimit,
      upperLimit
    });
  } else {
    responses[uuid] = [
      {
        res,
        thingUuid,
        itemId,
        evtFlags,
        timeSec,
        lowerLimit,
        upperLimit
      }
    ];
  }
  meshblu.connect();
});