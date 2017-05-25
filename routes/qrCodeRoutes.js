
const express = require('express');
const router = express.Router()
const qr = require('qr-image');
const fs = require('fs');
const srvUtils = require('../utils/serverUtils.js');

// var code = qr.image('http://blog.nodejitsu.com', { type: 'svg' });
// var output = fs.createWriteStream('nodejitsu.svg')


// define the home page route
router.get('/get/:supId', function (req, res) {
  // res.send('Hello World from login');
   let supId = req.params.supId;
   let serverAddr = srvUtils.address;
   let code = qr.image('http://'+serverAddr+'/supplement/view/'+supId, { type: 'svg' });
   res.type('svg');
   code.pipe(res);


});




module.exports = router
