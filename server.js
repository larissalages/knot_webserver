const express = require('express');
const app = express();

app.listen(8081, function() {
    console.log('listening on 8081')
  })

  app.get('/', function(req, res) {
    res.send('Site under development. Wait a moment, it will be great!')
  })