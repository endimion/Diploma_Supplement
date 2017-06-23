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
// Enroll "WebAppAdmin" which is already registered because it is
// listed in fabric/membersrvc/membersrvc.yaml with its one time password.
// If "WebAppAdmin" has already been registered, this will still succeed
// because it stores the state in the KeyValStore
// (i.e. in '/tmp/keyValStore' in this sample).
// chain.enroll("WebAppAdmin", "DJY27pEnl16d", function(err, webAppAdmin) {
//    if (err) return console.log("ERROR: failed to register %s: %s",err);
//    // Successfully enrolled WebAppAdmin during initialization.
//    // Set this user as the chain's registrar which is authorized to register other users.
//    chain.setRegistrar(webAppAdmin);
//    // Now begin listening for web app requests
//    listenForUserRequests();
// });

// enrollAndRegisterUsers("testUser",[]).then(res => {console.log(res)}).catch(err => {console.log(err)});
testDeploy();


// // Main web app function to listen for and handle requests
// function listenForUserRequests() {
//    for (;;) {
//       // WebApp-specific logic goes here to await the next request.
//       // ...
//       // Assume that we received a request from an authenticated user
//       // 'userName', and determined that we need to invoke the chaincode
//       // with 'chaincodeID' and function named 'fcn' with arguments 'args'.
//       handleUserRequest(userName,chaincodeID,fcn,args);
//    }
// }
//
// // Handle a user request
// function handleUserRequest(userName, chaincodeID, fcn, args) {
//    // Register and enroll this user.
//    // If this user has already been registered and/or enrolled, this will
//    // still succeed because the state is kept in the KeyValStore
//    // (i.e. in '/tmp/keyValStore' in this sample).
//    var registrationRequest = {
//         enrollmentID: userName,
//         // Customize account & affiliation
//         account: "bank_a",
//         affiliation: "00001"
//    };
//    chain.registerAndEnroll( registrationRequest, function(err, user) {
//       if (err) return console.log("ERROR: %s",err);
//       // Issue an invoke request
//       var invokeRequest = {
//         // Name (hash) required for invoke
//         chaincodeID: chaincodeID,
//         // Function to trigger
//         fcn: fcn,
//         // Parameters for the invoke function
//         args: args
//      };
//      // Invoke the request from the user object.
//      var tx = user.invoke(invokeRequest);
//      // Listen for the 'submitted' event
//      tx.on('submitted', function(results) {
//         console.log("submitted invoke: %j",results);
//      });
//      // Listen for the 'complete' event.
//      tx.on('complete', function(results) {
//         console.log("completed invoke: %j",results);
//      });
//      // Listen for the 'error' event.
//      tx.on('error', function(err) {
//         console.log("error on invoke: %j",err);
//      });
//    });
// }



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

          let enrollAttr = [{name:'typeOfUser',value:'University'}];
          //creating a new user
          var registrationRequest = {
            enrollmentID: userName,
            affiliation: "bank_a",
            attributes: enrollAttr
          };

          chain.registerAndEnroll(registrationRequest, function(err, user) {
            if (err) reject(" Failed to register and enroll " + userName + ": " + err);//throw Error(" Failed to register and enroll " + networkConfig.newUserName + ": " + err);

            console.log("\nEnrolled and registered " + userName + " successfully");
            // userObj = user;
            //setting timers for fabric waits
            // chain.setDeployWaitTime(config.deployWaitTime);
            chain.setDeployWaitTime(400);
            // networkConfig.chain.setInvokeWaitTime(60);
            // console.log("\nDeploying chaincode ...");

            //Similarly set timer for invocation transactions
            // networkConfig.chain.setInvokeWaitTime(100);
            resolve(user);
            // query2(user);
          });
        });
      }catch(err){reject(err)}
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
