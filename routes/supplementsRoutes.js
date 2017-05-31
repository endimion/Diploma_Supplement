
const express = require('express');
const router = express.Router()
const randomstring = require("randomstring");
const basic = require('../basicFunctions');
const chainCodeQuery = require('../ChaincodeQuery.js');
const supUtils = require('../utils/SupplementUtils.js');
const emailHelper = require('../utils/emailClient.js');
const srvUtils = require('../utils/serverUtils.js');

router.get('/publish',(req,res) =>{

  res.render('publishSupplementView',{ title: 'Publish a new Diploma Supplement',
  message: 'Welcome user: ' + req.session.eID ,
  supId: randomstring.generate(10),
  university: req.session.eID});
});



router.post('/publish',(req,res) =>{


  let owner = req.body.owner;
  let university = req.body.university;
  let _id = req.body.id;

  let publishArgs = ['{"Owner":"'+ owner +'", "University":"'+university+'","Authorized":[],"Id":"'+_id+'"}' ];
  let _enrollAttr = [{name:'typeOfUser',value:'University'},{name:"eID",value:university.toString()}];

  // console.log(_enrollAttr);



  let _invAttr = ['typeOfUser','eID'];

  let publishReq = {
    // Name (hash) required for invoke
    chaincodeID: basic.config.chaincodeID,
    // Function to trigger
    fcn: "publish",
    // Parameters for the invoke function
    args: publishArgs,
    //pass explicit attributes to teh query
    attrs: _invAttr
  };


  let publishFnc = curryInvokeRequest(publishReq,req,res);

  /**
  closure to include a counter, to attempt to publish for a max of 10 times;
  **/
  let tryToPublish = (function(){
    let counter = 0;

    return function(){
      basic.enrollAndRegisterUsers(university,_enrollAttr)
      .then(publishFnc)
      .then( rsp => {
        counter = 10;
        res.send(rsp);
      })
      .catch(err =>{
        // console.log("counter" + counter);
        if(counter < 10){
          console.log("AN ERROR OCCURED!!! atempt:"+counter+"\n");
          console.log(err);
          counter ++;
          tryToPublish();
        }else{
          res.send("failed, to get  supplements after " + counter + " attempts");
        }
      });

    }
  })();
  tryToPublish();
});



router.get('/view',(req,res) =>{

  let queryArgs = [req.session.eID];
  let userName = req.session.eID;

  let enrollAttr = [{name:'typeOfUser',value: req.session.userType},{name:"eID",value:req.session.eID}];
  let queryAttributes = ['typeOfUser'];

  let testQ2 = new chainCodeQuery(queryAttributes, queryArgs, basic.config.chaincodeID,"getSupplements",basic.query);
  let testQfunc2 = testQ2.makeQuery.bind(testQ2);

  /**
  closure to add atempts to re-try in case of exceptions
  **/
  let tryToGetSupplements = (function(){
    let counter = 0;
    let supplements =[];

    return function(){
      basic.enrollAndRegisterUsers(userName,enrollAttr)
      .then(testQfunc2)
      .then(response =>{
        console.log("\nthe result is" + response);
        counter = 10;
        // res.send(JSON.parse(response));
        supplements = JSON.parse(response);
        // process.exit(0);
        res.render('viewSupplements',{ title: 'Published Supplements',
        message: 'Welcome user: ' + req.session.eID , userType: req.session.userType,
        supplements: supplements});
      })
      .catch(err =>{
        console.log("AN ERROR OCCURED!!! atempt:"+counter+"\n");
        console.log(err);
        if(counter < 10){
          counter ++;
          tryToGetSupplements();
        }else{
          res.send("failed, to get  supplements after " + counter + " attempts");
        }
      });
    }


  })();
  tryToGetSupplements();
});






router.get('/edit/:supId',(req,res) =>{
  let supId = req.params.supId;
  let userName = req.session.eID;
  let _args = [supId];
  let _enrollAttr = [{name:'typeOfUser',value:req.session.userType},{name:"eID",value:req.session.eID}];
  let _qAttr = ['typeOfUser','eID'];

  let getSupsById = new chainCodeQuery(_qAttr, _args, basic.config.chaincodeID,"getSupplementById",basic.query);
  let getSupsByIdBound = getSupsById.makeQuery.bind(getSupsById);


  let tryToGetSupplement = (function(){
    let counter = 0;


    return function(){
      basic.enrollAndRegisterUsers(userName,_enrollAttr)
      .then(getSupsByIdBound)
      .then(response =>{
        console.log("\nthe result is" + response);
        counter = 10;
        // res.send(JSON.parse(response));
        let supplement = JSON.parse(response);
        // process.exit(0);
        res.render('editSupplement',{ title: 'Edit Supplement',
        message: 'Welcome user: ' + req.session.eID , userType: req.session.userType,
        supplement: supplement});
      })
      .catch(err =>{
        console.log("AN ERROR OCCURED!!! atempt:"+counter+"\n");
        console.log(err);
        if(counter < 10){
          counter ++;
          tryToGetSupplement();
        }else{
          res.send("failed, to get  supplement after " + counter + " attempts");
        }
      });
    }


  })();
  tryToGetSupplement();


  // res.send(supId);
});


/* TODO clean up this code
*/
router.get('/view/:dsHash',(req,res) =>{
  let userName = req.session.eID;
  let dsHash = req.params.dsHash;

  if(userName){
    let _enrollAttr = [{name:'typeOfUser',value:req.session.userType},{name:"eID",value:req.session.eID}];

    let tryGenerateCode = function(user){
      let _args = [dsHash];
      let _invAttr = ['typeOfUser','eID'];
      let invReq = {
        chaincodeID: basic.config.chaincodeID,
        fcn: "genCodeForDSMap",
        args: _args,
        attrs: _invAttr
      };
      return new Promise(function(resolve,reject){
        basic.invoke(user,invReq)
        .then(response => {
          console.log(response);
          resolve(user)
        })
        .catch(err => {
          console.log(err);
          reject(err);
        })
      });
    };

    let tryToGetDSHash = (function(){
      // let counter = 0;
      let _qAttr = ['typeOfUser','eID'];
      let dsHashargs = [dsHash];
      let getHashQ = new chainCodeQuery(_qAttr, dsHashargs, basic.config.chaincodeID,"getDiplomaSupplementMapsByHash",basic.query);
      let getHashBound = getHashQ.makeQuery.bind(getHashQ);
      return function(user){
        return new Promise(function(resolve,reject){
          getHashBound(user)
          .then(response => {
            let dsHash = JSON.parse(response);
            resolve({"user":user,"supId": dsHash.DSId, "email":dsHash.Email, "code":dsHash.Code,
            "recipient":dsHash.Recipient });
          })
          .catch(err => reject(err));
        });
      }
    })();

    let tryToEmailCode = function(data){
      let emailBody = "<p> Your validation code is " + data.code + "</p>";
      return emailHelper.sendEmail(data.email,emailBody);
    }


    let  checkIfDSMapIsFinalized = (function(){
      let counter = 0;
      return function(){
        basic.enrollAndRegisterUsers(userName,_enrollAttr)
        .then(tryToGetDSHash)
        .then(data =>{
          if(data.recipient === ""){
            tryToGenerateAndEmailCode(data.user);
          }else{
            tryToGetSup(data);
          }
        })
        .catch(err =>{
          console.log(err);
          if(counter < 10){
            counter ++;
            checkIfDSMapIsFinalized();
          }else{
            res.send("failed, to get  supplement after " + counter + " attempts");
          }
        })
      }})();
      checkIfDSMapIsFinalized();



      let tryToGenerateAndEmailCode = (function(){
        let counter = 0;
        return function(user){
          // basic.enrollAndRegisterUsers(userName,_enrollAttr)
          // .then(tryGenerateCode)
          tryGenerateCode(user)
          .then(tryToGetDSHash)
          .then(tryToEmailCode)
          .then(response =>{
            console.log("\nthe result is" + response);
            counter = 10;
            res.render('validationCodeView',
            { title: 'Enter Validation Code',
            message: ' <p> Welcome user: ' + req.session.eID  + '</p>'
            +'<p> Please enter below the validation code you received via email </p>'   ,
            userType: req.session.userType,
            dsHash: dsHash});
          })
          .catch(err =>{
            console.log("AN ERROR OCCURED!!! atempt:"+counter+"\n");
            console.log(err);
            if(err.msg && err.msg.indexOf("User not Authorized") >=0){
              counter = 10;
            }
            if(counter < 10){
              counter ++;
              tryToGenerateAndEmailCode(user);
            }else{
              res.send("failed, to get  supplement after " + counter + " attempts");
            }
          });
        }
      })();
      // tryToGenerateAndEmailCode();

      let tryToGetSup = (function(){
        let counter = 0;
        return function(data){
          let user = data.user;
          let email = [data.email];
          let _args = [data.supId];
          let _qAttr = ['typeOfUser','eID'];
          let testQ2 = new chainCodeQuery(_qAttr, _args, basic.config.chaincodeID,"getSupplementById",basic.query);
          let testQfunc2 = testQ2.makeQuery.bind(testQ2);
          // return new Promise(function(resolve,reject){
          testQfunc2(user)
          .then(response => {
            counter = 10;
            let supplement = JSON.parse(response);
            res.render('viewSingleSupplement',{ title: 'View Supplement',
            message: 'Welcome user: ' + req.session.eID , userType: req.session.userType,
            supplement: supplement});
          })
          .catch(err => {
              if(counter < 10){
                counter ++;
                tryToGetSup(data);
              }else{
                res.send("failed, to get  supplement after " + counter + " attempts");
              }
          })
        }})();

      }else{
        res.render('loginAndRedirect',{ title: 'Login',
        message: 'Login to View Supplement',
        supId: dsHash});
      }
    });



    router.post('/view/auth/:dsHash',(req,res) =>{
      let userName = req.session.eID;
      let dsHash = req.params.dsHash;
      let code = req.body.valCode;


      console.log("user " + userName + " dsHash " + dsHash + " code " + code );

      if(userName){
        let _enrollAttr = [{name:'typeOfUser',value:req.session.userType},{name:"eID",value:req.session.eID}];

        let tryToGetDSHash =  function(user){
          let _qAttr = ['typeOfUser','eID'];
          let dsHashargs = [dsHash];
          let getHashQ = new chainCodeQuery(_qAttr, dsHashargs, basic.config.chaincodeID,"getDiplomaSupplementMapsByHash",basic.query);
          let getHashBound = getHashQ.makeQuery.bind(getHashQ);
          return new Promise(function(resolve,reject){
            getHashBound(user)
            .then(response => {
              let result = JSON.parse(response);
              // console.log(result);
              resolve({"user":user,"supId": result.DSId, "email":result.Email,
              "dsHash" : result.DSHash});
            })
            .catch(err => reject(err));
          });
        };

        let tryToUpdateDSMapReceipient = function(data){
          let user = data.user;
          let _args = [data.dsHash,userName,code];
          let _invAttr = ['typeOfUser','eID'];
          let invReq = {
            chaincodeID: basic.config.chaincodeID,
            fcn: "addRecepientToDSMap",
            args: _args,
            attrs: _invAttr
          };
          // console.log(invReq);

          return new Promise(function(resolve,reject){
            basic.invoke(user,invReq)
            .then(response => {
              // console.log(response);
              resolve(data)
            })
            .catch(err => {
              console.log(err);
              resolve(data);
            })

          });
        };



        let tryToGetSup = function(data){

          let user = data.user;
          let email = [data.email];
          let _args = [data.supId];
          let _qAttr = ['typeOfUser','eID'];
          // console.log("Query:   args " + data.supId + " email " + email);
          // console.log({name:'typeOfUser',value:req.session.userType},{name:"eID",value:req.session.eID});

          let testQ2 = new chainCodeQuery(_qAttr, _args, basic.config.chaincodeID,"getSupplementById",basic.query);
          let testQfunc2 = testQ2.makeQuery.bind(testQ2);
          return new Promise(function(resolve,reject){
            testQfunc2(user)
            .then(response => {
              resolve(response);
            })
            .catch(err => reject(err));
          });
        };


        let tryToGetDSMapAndSup = (function(){
          let counter = 0;
          return function(){
            basic.enrollAndRegisterUsers(userName,_enrollAttr)
            .then(tryToGetDSHash)
            .then(tryToUpdateDSMapReceipient)
            .then(tryToGetSup)
            .then(response =>{
              // console.log("\nthe result is" + response);
              counter = 10;
              let supplement = JSON.parse(response);
              res.render('viewSingleSupplement',{ title: 'View Supplement',
              message: 'Welcome user: ' + req.session.eID , userType: req.session.userType,
              supplement: supplement});
            })
            .catch(err =>{
              console.log("AN ERROR OCCURED!!! atempt:"+counter+"\n");
              console.log(err);
              if(err.msg.indexOf("User not Authorized") >=0){
                counter = 10;
              }
              if(counter < 10){
                counter ++;
                tryToGetDSMapAndSup();
              }else{
                res.send("failed, to get  supplement after " + counter + " attempts");
              }
            });
          }
        })();
        tryToGetDSMapAndSup();
      }else{
        res.render('loginAndRedirect',{ title: 'Login',
        message: 'Login to View Supplement',
        supId: dsHash});
      }
    });







    router.post('/share',(req,res) =>{
      let employerEmail = req.body.email;
      let supId = req.body.supId?req.body.supId:"12345";
      let userName = req.session.eID?req.session.eID:"studentEid";
      let dsNonceHash = supUtils.generateSupplementHash(employerEmail, supId, userName);
      let _enrollAttr = [{name:'typeOfUser',value:req.session.userType},{name:"eID",value:"studentEid"}];
      let _invAttr = ['typeOfUser','eID'];

      let addDSMapArgs = ['{"DSHash":"'+dsNonceHash+'", "DSId":"'+supId+'", "Email":"'+employerEmail+'", "Recipient":null}' ];

      let emailBody = '<p>Click<a href="http://' + srvUtils.address + ':'+srvUtils.port+'/supplement/view/'
      +dsNonceHash +'"> here</a> to view the shared diploma supplement </p>';

      let addDSMapReq = {
        // Name (hash) required for invoke
        chaincodeID: basic.config.chaincodeID,
        // Function to trigger
        fcn: "addDiplomaSupplementMap",
        // Parameters for the invoke function
        args: addDSMapArgs,
        //pass explicit attributes to teh query
        attrs: _invAttr
      };


      let addDSFnc = curryInvokeRequest(addDSMapReq,req,res);
      /**
      closure to include a counter, to attempt to invoke for a max of 10times
      **/
      let tryToAddDS = (function(){
        let counter = 0;
        return function(){
          basic.enrollAndRegisterUsers(userName,_enrollAttr)
          .then(addDSFnc)
          .then( rsp => {
            counter = 10;

            emailHelper.sendEmail(employerEmail,emailBody); //this returns a promise
            res.status(200).send(rsp);
          })
          .catch(err =>{
            // console.log("counter" + counter);
            if(counter < 10){
              console.log("AN ERROR OCCURED!!! atempt:"+counter+"\n");
              console.log(err);
              counter ++;
              tryToAddDS();
            }else{
              res.status(400).send("failed, to get  supplements after " + counter + " attempts");
            }
          });

        }
      })();
      tryToAddDS();


      // res.send("nonce is " + dsNonceHash);



    });






    router.post('/addAuthorizedUser',(req,res) =>{

      let employer = req.body.name;
      let supId = req.body.supId;
      let userName = req.session.eID;
      let _args = [supId,employer];
      let _enrollAttr = [{name:'typeOfUser',value:req.session.userType},{name:"eID",value:req.session.eID}];
      let _invAttr = ['typeOfUser','eID'];

      let request = {
        // Name (hash) required for invoke
        chaincodeID: basic.config.chaincodeID,
        // Function to trigger
        fcn: "addAuthorizedUser",
        // Parameters for the invoke function
        args: _args,
        //pass explicit attributes to teh query
        attrs: _invAttr
      };

      let addAuthUserCurry = curryInvokeRequest(request,req,res);

      let tryAddUser = (function(){
        let counter = 0;
        return function(){
          basic.enrollAndRegisterUsers(userName,_enrollAttr)
          .then(addAuthUserCurry)
          .then( rsp => {
            counter = 10;
            res.redirect("/login");
          })
          .catch(err =>{
            console.log("AN ERROR OCCURED!!! atempt:"+counter+"\n");
            console.log(err);
            if(counter < 10){
              counter ++;
              tryAddUser();
            }else{
              res.send("failed, to get  supplement after " + counter + " attempts");
            }
          });
        }})();

        tryAddUser();
        // res.send("addUser");
      });




      /**
      *  Currying of the basic invoke function so that the resulting
      function will only take the user as input
      @param supplementRequest the invokation request object to publish a supplementRequest
      @param req teh express reqeust object
      @param res the express response object used to send the response back to the user
      */
      function curryInvokeRequest(supplementRequest,req,res){

        return function(user){
          return  new Promise(function(resolve,reject){

            console.log("will send invoke request");
            basic.invoke(user,supplementRequest)
            .then(rsp=> {
              console.log("the response is: \n");
              console.log(rsp);
              // res.send(" user " + req.session.eID + " type " + req.session.userType + "\n response \n"
              // +response.toString());
              resolve(rsp);
              // process.exit(0);
            }).catch(err => {
              reject(err)
            });
          });

        }


      }


      module.exports = router
