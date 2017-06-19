'use strict';

const express = require('express');
const router = express.Router()
const request = require('request');
// Generate a v1 UUID (time-based)
const uuid = require('uuid/v1');
const hash = require('hash.js');




// define the home page route
router.get('/', function (req, res) {
  // res.send('Hello World from login');
  if(!req.session.userType  && !req.session.eID){
    // res.render('login',{ title: 'Login', message: 'Login to the DiplomaSupplement WebApp' });
    res.render('landing',{ title: 'Login', message: 'Login to the DiplomaSupplement WebApp' });

  }else{

    if(req.session.userType === 'Student'){
      res.render('stdMainView',{ title: 'Publish a new Diploma Supplement',
      message: 'Welcome user: ' + req.session.eID ,
      eID: req.session.eID,
      userName: req.session.userName,
      firstName: req.session.firstName,
      lastName: req.session.lastName});
    }else{
      res.render('errorMessage',{ title: 'Ooops... an error occured!',
      message: "Unsupported type of user " +req.session.userType ,
      stdId: req.session.eID});
    }
  }
});


router.post('/',(req,res) =>{
  // console.log("req body " );
  // console.log(req.body);

  let userName = req.body.name;
  let password = req.body.password;
  if(userName.toLowerCase() === 'ntua' && password === 'panathinaikos'){
    req.session.userType = 'University';
    req.session.eID = 'ntua';

    // res.send("University logged in");
    res.render('univMainView',{ title: 'Publish a new Diploma Supplement',
    message: 'Welcome user: ' + req.session.eID ,
    university: req.session.eID});
  }else{
    if(userName.toLowerCase() ==='student' || userName ){

      req.session.userType = 'Student';
      req.session.eID = userName;
      res.render('stdMainView',{ title: 'Manage Your Diploma Supplements',
      message: 'Welcome user: ' + req.session.eID ,
      eID: req.session.eID,
      userName: req.session.userName,
      firstName: req.session.firstName,
      lastName: req.session.lastName});
    }else{
      res.send("wrong username password combination")

    }


  }


});





router.post('/loginAndRedirect',(req,res)=>{
  let userName = req.body.name;
  let password = req.body.password;
  let supId = req.body.supId;

  req.session.eID = userName;

  if(userName.toLowerCase() === 'ntua' && password === 'panathinaikos'){
    req.session.userType = 'University';
  }else{
    if(userName.toLowerCase() ==='student' || userName ){
      req.session.userType = 'Student';
    }else{
      res.send("wrong username password combination")
    }
  }
  res.  res.redirect(303,"/supplement/view/"+supId);(303,"/supplement/view/"+supId);
});




router.get('/logout',(req,res) =>{
  req.session.destroy(function(err) {
    if(err) {
      console.log(err);
    } else {
      res.redirect(303,"/login");
    }
  });
});


router.get('/eIDAS', function (req, res) {
  if(!req.session.userType  && !req.session.eID){
    // res.render('loginEIDAS',{ title: 'Login with eIDAS',
    // message: 'Login to the DiplomaSupplement System using the eIDAS system',
    // token: uuid() });

    res.redirect(303, "http://84.205.248.180/ISSPlus/ValidateToken?t="+ uuid()+"&sp=sp1&cc=CA&saml=eIDAS");
  }
});



//TODO do not leave the url hardcoded
router.get('/authenticate/:token',(req,res) =>{
  let token = req.params.token;
  let siteURL = 'http://community.mastihawonder.com:8080/testISSsp-0.0.1-SNAPSHOT/'
  +'user?token=' + token;
  console.log("/autheticate/token/"+token);

  let userDetails ;
  request.get(siteURL,function (error, response, body) {
    try{
      userDetails = JSON.parse(body);
      console.log("userDeatils" );
      console.log(userDetails);
    }catch(err){
      if(!error) error =err;
    }

    if (!error && req.session &&  userDetails
          && response.statusCode == 200 && userDetails.userName && userDetails.eid) {
      // console.log(body)
      // let userDetails = JSON.parse(body);
      // req.session.eID = userDetails.eid;
      //hash the eID we receive
      //because it might contain weird characters
      req.session.eID = hash.sha256().update(userDetails.eid).digest('hex');
      req.session.userType = 'Student';
      req.session.userName = userDetails.userName;
      req.session.firstName = userDetails.firstName;
      req.session.lastName = userDetails.lastName;
      let cookie = req.cookies.dsHash;
      if (cookie === undefined)
      {
        res.render('stdMainView',{ title: 'Manage Your Diploma Supplements',
        message: 'Welcome user: ' + req.session.userName ,
        eID: req.session.eID,
        userName: req.session.userName,
        firstName: req.session.firstName,
        lastName: req.session.lastName});
      }else{
        res.redirect(303,"/supplement/view/"+cookie);
      }

    }else{
      // console.log("Error with GET REQUEST at " + siteURL)
      if(!userDetails || !userDetails.eid){error = "Session expried, please reauthenticate using eIDAS"}
      res.render('errorMessage',{ title: 'Ooops... an error occured!',
      message: error,
      stdId: req.session.eID});
    }
  });

});




module.exports = router
