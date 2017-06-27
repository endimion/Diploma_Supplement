"use strict";
process.env.GOPATH = __dirname;
/**
* This example shows how to do the following in a web app.
* 1) At initialization time, enroll the web app with the block chain.
*    The identity must have already been registered.
* 2) At run time, after a user has authenticated with the web app:
*    a) register and enroll an identity for the user;
*    b) use this identity to deploy, query, and invoke a chaincode.
*/

// To include the package from your hyperledger fabric directory:
//    var hfc = require("myFabricDir/sdk/node");
// To include the package from npm:
//      var hfc = require('hfc');
var hfc = require('hfc');
var util = require('util');
var fs = require('fs');
let ChainCodeQuery = require('./ChaincodeQuery.js');

// Create a client chain.
// The name can be anything as it is only used internally.
var chain = hfc.newChain("targetChain");

var chaincodeIDPath = __dirname + "/chaincodeIDLocalHost";

// Configure the KeyValStore which is used to store sensitive keys
// as so it is important to secure this storage.
// The FileKeyValStore is a simple file-based KeyValStore, but you
// can easily implement your own to store whereever you want.
chain.setKeyValStore( hfc.newFileKeyValStore(__dirname+'/tmp/keyValStore') );

// Set the URL for member services
chain.setMemberServicesUrl("grpc://172.17.0.1:7054");

// Add a peer's URL
chain.addPeer("grpc://172.17.0.1:7051");
chain.eventHubConnect("grpc://172.17.0.1:7053");
process.on('exit', function() {
  chain.eventHubDisconnect();
});

// testDeploy();
testRequestSupplementPublication();
// testGetPendingPubRequests();







function testDeploy(){
  let depArgs = [
    "a",
    "100",
    "b",
    "200"
  ];
  let depFunCName = "init";
  let chaincodePath = "chaincode";
  let certPath  = "";

  let deployRequest = {
    // Function to trigger
    fcn:depFunCName,
    // Arguments to the initializing function
    args: depArgs,
    chaincodePath: chaincodePath
    // ,
    // the location where the startup and HSBN store the certificates
    // certificatePath: basic.config.network.cert_path
  };


  enrollAndRegisterUsers('deployer2',[])
  .then( user => {
    deployChaincodeWithParams(user,deployRequest)
    .then(
      res=> {console.log(res);
        process.exit(0);
      }).catch(err =>{
        console.log(err);
        process.exit(1);
      });
    }).catch(err =>{
      console.log(err);
    });
  }




  function testRequestSupplementPublication(){
    let _args = ["testName","testEid","testUniId","testEmail","testEidHash","testUniversity"];
    let _enrollAttr = [{name:'typeOfUser',value:'Student'},{name:"eID",value:"studentEid"}];
    let _invAttr = ['typeOfUser','eID'];
    let req = {
      chaincodeID: fs.readFileSync(__dirname + "/chaincodeIDLocalHost", 'utf8'),
      fcn: "requestSupplementPublication",
      args: _args,
      attrs: _invAttr
    };
    enrollAndRegisterUsers("someStudent",_enrollAttr)
    .then(user => {
      invokeWithParams(user,req)
      .then(res=> {
        console.log(res);
      }).catch(err =>{
        console.log(err);
        process.exit(1);
      });
    }).catch(err =>{
      console.log(err);
    });
  }




  function testGetPendingPubRequests(){
    let enrollAttr = [{name:'typeOfUser',value:'University'},{name:"eID",value:"testUniId"}];
      let queryAttr = ['typeOfUser','eID'];
    let _args = [];
    let chaincodeID = fs.readFileSync(__dirname + "/chaincodeIDLocalHost", 'utf8')
    let testQ2 = new ChainCodeQuery(queryAttr, _args, chaincodeID,"getPendingRequestByUniv",queryByReqAndAttributes);
    let testQfunc2 = testQ2.makeQuery.bind(testQ2);
     enrollAndRegisterUsers("ntuaUser",enrollAttr)
    .then(testQfunc2).then(res =>{
      console.log("\nthe result is" + res);
      process.exit(0);
    })
    .catch(err =>{
      console.log("AN ERROR OCCURED!!!");
      console.log(err);
      process.exit(1);
    });
  }











  function enrollAndRegisterUsers(userName,enrollAttr) {
    return new Promise(function(resolve,reject){
      try{
        // Enroll a 'admin' who is already registered because it is
        // listed in fabric/membersrvc/membersrvc.yaml with it's one time password.
        chain.enroll("admin", "Xurw3yU9zI0l", function(err, admin) {
          if (err) reject("\nERROR: failed to enroll admin : " + err) ;
          console.log("\nEnrolled admin sucecssfully");
          // Set this user as the chain's registrar which is authorized to register other users.
          chain.setRegistrar(admin);

          // let enrollAttr = [{name:'typeOfUser',value:'University'}];
          //creating a new user
          var registrationRequest = {
            enrollmentID: userName,
            affiliation: "bank_a",
            attributes: enrollAttr
          };

          chain.registerAndEnroll(registrationRequest, function(err, user) {
            if (err) reject(" Failed to register and enroll " + userName + ": " + err);

            console.log("\nEnrolled and registered " + userName + " successfully");
            // userObj = user;
            //setting timers for fabric waits
            // chain.setDeployWaitTime(config.deployWaitTime);
            chain.setDeployWaitTime(400);

            // console.log("\nDeploying chaincode ...");

            //Similarly set timer for invocation transactions

            resolve(user);
            // query2(user);
          });
        });
      }catch(err){reject(err)}
    });
  }



  function queryByReqAndAttributes(userObj,request,attr) {
    return new Promise(function(resolve,reject){
      try{
        // Trigger the query transaction
        var queryTx = userObj.query(request);
        // Print the query results
        queryTx.on('complete', function(results) {
          // Query completed successfully
          console.log("\nSuccessfully queried  chaincode function: request=%j, value=%s", request, results.result.toString());
          //process.exit(0);
          resolve(results.result.toString());
        });
        queryTx.on('error', function(err) {
          // Query failed
          console.log("\nFailed to query chaincode, function: request=%j, error=%j", request, err);
          //process.exit(1);
          reject(err);
        });
      }catch(err){
        console.log("Error caught during query");
        reject(err);
      }
    });
  }



  function invokeWithParams(userObj,invReq) {

    var txHash="qwe";

    return new Promise(function(resolve,reject){
      var eh = chain.getEventHub();
      // Trigger the invoke transaction
      var invokeTx = userObj.invoke(invReq);
      // Print the invoke results
      invokeTx.on('submitted', function(results) {
        // Invoke transaction submitted successfully
        console.log(util.format("\nSuccessfully submitted chaincode invoke transaction: request=%j, response=%j", invReq, results));
        txHash = results.uuid;

      });
      invokeTx.on('complete', function(results) {
        // Invoke transaction completed successfully
        console.log(util.format("\nSuccessfully completed chaincode invoke transaction: request=%j, response=%j", invReq, results));
        // resolve(results);
        // txHash = results.uuid;

      });
      invokeTx.on('error', function(err) {
        reject(err);
      });

      //Listen to custom events
      var regid = eh.registerChaincodeEvent(invReq.chaincodeID, "evtsender", function(event) {
        console.log(util.format("Custom event received, payload: %j\n", event.payload.toString()));

        if(event.payload.toString() && event.payload.toString().indexOf("Error") >= 0){
          let uuid = event.payload.toString().split(".")[1];
          eh.unregisterChaincodeEvent(regid);
          if(uuid === txHash){ //resolve promise only when the current transaction has finished
            eh.unregisterChaincodeEvent(regid);
            reject(event.payload.toString());
          }
        }
        if(event.payload.toString()&& event.payload.toString().indexOf("Tx chaincode finished OK") >= 0){
          let uuid = event.payload.toString().split(".")[1];
          console.log("\nUUID " + uuid);
          console.log("\ntxHash " + txHash);
          if(uuid === txHash){ //resolve promise only when the current transaction has finished
            eh.unregisterChaincodeEvent(regid);
            resolve(event.payload.toString());
          }

        }
      });
    });
  }



  function deployChaincodeWithParams(userObj,deployReq) {
    return new Promise(function(resolve,reject){
      // Trigger the deploy transaction
      var deployTx = userObj.deploy(deployReq);
      console.log("will deploy");
      console.log(deployReq);
      // Print the deploy results
      deployTx.on('complete', function(results) {
        // Deploy request completed successfully
        let chaincodeID = results.chaincodeID;
        console.log("\nChaincode ID : " + chaincodeID);
        console.log(util.format("\nSuccessfully deployed chaincode: request=%j, response=%j", deployReq, results));
        // Save the chaincodeID
        fs.writeFileSync(chaincodeIDPath, chaincodeID);
        //invoke();
        resolve(results);
      });

      deployTx.on('error', function(err) {
        // Deploy request failed
        console.log(util.format("\nFailed to deploy chaincode: request=%j, error=%j", deployReq, err));
        // process.exit(1);
        reject(err);
      });
    });
  }
