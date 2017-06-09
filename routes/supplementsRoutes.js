/*jslint es6 */
/*jslint node: true */

const express = require('express');
const router = express.Router();
const randomstring = require("randomstring");
const basic = require('../basicFunctions');
const chainCodeQuery = require('../ChaincodeQuery.js');
const supUtils = require('../utils/SupplementUtils.js');
const emailHelper = require('../utils/emailClient.js');
const srvUtils = require('../utils/serverUtils.js');
const hfcService = require('../service/HfcService');

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
  hfcService.publishSupplement(owner,university,_id)
  .then( result => {
      //  res.send(result);
      if(req.session.userType === 'University'){
        res.render('univMainView',{ title: 'University Management Page',
        message: 'Welcome user: ' + req.session.eID  + ".\n Supplement Published Successfully!!",
        university: req.session.eID});
      }else{
        if(req.session.userType === 'Student'){
          res.render('stdMainView',{ title: 'Publish a new Diploma Supplement',
          message: 'Welcome user: ' + req.session.eID ,
          stdId: req.session.eID});
        }
      }
  })
  .catch( err => {
       res.send(err);
  });
});



router.get('/view',(req,res) =>{
    let userEid = req.session.eID;
    let userType =  req.session.userType;
    hfcService.getSupplements(userEid,userType)
    .then(result => {
      res.render('viewSupplements',{ title: 'Published Supplements',
            message: 'Welcome user: ' + req.session.eID , userType: req.session.userType,
            supplements: result});
    })
    .catch(err =>{
      res.render('errorMessage',{ title: 'Ooops... an error occured!',
                  message: err.toString(),
                  stdId: req.session.eID});
    });
});






// router.get('/edit/:supId',(req,res) =>{
//   let supId = req.params.supId;
//   let userName = req.session.eID;
//   let _args = [supId];
//   let _enrollAttr = [{name:'typeOfUser',value:req.session.userType},{name:"eID",value:req.session.eID}];
//   let _qAttr = ['typeOfUser','eID'];
//
//   let getSupsById = new chainCodeQuery(_qAttr, _args, basic.config.chaincodeID,"getSupplementById",basic.query);
//   let getSupsByIdBound = getSupsById.makeQuery.bind(getSupsById);
//
//
//   let tryToGetSupplement = (function(){
//     let counter = 0;
//
//
//     return function(){
//       basic.enrollAndRegisterUsers(userName,_enrollAttr)
//       .then(getSupsByIdBound)
//       .then(response =>{
//         console.log("\nthe result is" + response);
//         counter = 10;
//         // res.send(JSON.parse(response));
//         let supplement = JSON.parse(response);
//         // process.exit(0);
//         res.render('editSupplement',{ title: 'Edit Supplement',
//         message: 'Welcome user: ' + req.session.eID , userType: req.session.userType,
//         supplement: supplement});
//       })
//       .catch(err =>{
//         console.log("AN ERROR OCCURED!!! atempt:"+counter+"\n");
//         console.log(err);
//         if(counter < 10){
//           counter ++;
//           tryToGetSupplement();
//         }else{
//           res.send("failed, to get  supplement after " + counter + " attempts");
//         }
//       });
//     }
//
//
//   })();
//   tryToGetSupplement();
//
//
//   // res.send(supId);
// });



router.get('/view/:dsHash',(req,res) =>{
  let userName = req.session.eID;
  let dsHash = req.params.dsHash;
  let userType = req.session.userType;
  if(userName){
    hfcService.getSupplementByHash(userName,dsHash,userType)
      .then(result => {
            // console.log("\nersult \n") ;
            // console.log(result);
            res.render(result.view,result);
      })
      .catch(err =>{
            console.log(err);
            res.render('errorMessage',{ title: 'Ooops... an error occured!',
                        message: err.toString(),
                        stdId: req.session.eID});
      });
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
      let supId = req.body.supId;
      let userName = req.session.eID;

      hfcService.shareSupplement(employerEmail,supId,userName,req.session.userType)
      .then(rsp => res.status(200).send(rsp))
      .catch(err => {
        console.log(err);
        res.status(400).send(err)
      });
    });


    router.post('/shareQR',(req,res) =>{
      let employerEmail = req.body.email;
      let supId = req.body.supId;
      let userName = req.session.eID;

      hfcService.shareSupplementQR(employerEmail,supId,userName,req.session.userType)
      .then(qrCodeObj => {
            res.type('svg');
            qrCodeObj.pipe(res);
            // res.status(200).send(rsp)
        })
      .catch(err => {
        console.log(err);
        res.status(400).send(err)
      });
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
