const express = require('express');
const app = express();

app.listen(8081, function() {
    console.log('listening on 8081')
  })

  app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html')
  })
  app.post('/getDevices', (req, res) => {
    console.log('Test')
  })