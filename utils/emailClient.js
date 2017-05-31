'use strict';
var path = require('path');

const nodemailer = require('nodemailer');
const fileUtils = require('./FileUtils');
const srvUtils = require('../utils/serverUtils.js');

exports.sendEmail = sendEmail;



/**
Sends an email and returns a Promise that it will be sent
**/
function sendEmail(receiverAddress,body){

  return new Promise( (resolve,reject) => {
    let thePath = path.join(__dirname, '..', 'resources',  'emailCredentials');
    fileUtils.readFilePromise(thePath)
    .then( _pass => {
      // console.log("pass" + pass);
      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'triantafyllou.ni@gmail.com',
          pass: _pass
        }
      });

      console.log( 'Email Body ' + body );
      // setup email data with unicode symbols
      let mailOptions = {
        from: '"Diploma Supplement Service" <dss@aegean.gr>', // sender address
        to: receiverAddress,// list of receivers
        subject: 'A Diploma Supplement has been shared with you ', // Subject line
        text: body,//'Hello world ?', // plain text body
        html: body //Hello world ?</b>' // html body
      };
        transporter.sendMail(mailOptions)
        .then(result => {
                console.log("mail sent");
                resolve(result);
        })
        .catch(err => {
                console.log(error);
                reject(err)
        });
    })
    .catch(err => {reject(err);})
  });
};
