'use strict';

process.env.GOPATH = __dirname;

var hfc = require('hfc');
var util = require('util');
var fs = require('fs');
const https = require('https');


var userObj;

var chaincodeID;
//var certFile = 'us.blockchain.ibm.com.cert';
var chaincodeIDPath = __dirname + "/chaincodeID";



// object to hold all of the configuration of the
// blockchain
let networkConfig = {
  certFile :'us.blockchain.ibm.com.cert'
};


//initNetwork();

//exported modules
exports.init = initNetwork;
exports.config = networkConfig;
exports.enrollAndRegisterUsers = enrollAndRegisterUsers;
exports.query = queryByReqAndAttributes;
exports.invoke = invokeWithParams;
exports.deploy = deployChaincodeWithParams;

function initNetwork() {
  try {
    networkConfig.config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));
    // Create a client blockchin.
    networkConfig.chain = hfc.newChain(networkConfig.config.chainName);

  } catch (err) {
    console.log("config.json is missing or invalid file, Rerun the program with right file")
    process.exit();
  }





  //path to copy the certificate
  networkConfig.certPath = __dirname + "/src/" + networkConfig.config.deployRequest.chaincodePath
  + "/certificate.pem";
  // Read and process the credentials.json
  try {
    networkConfig.network = JSON.parse(fs.readFileSync(__dirname + '/ServiceCredentials.json', 'utf8'));
    if (networkConfig.network.credentials) network = networkConfig.network.credentials;
  } catch (err) {
    console.log("ServiceCredentials.json is missing or invalid file, Rerun the program with right file")
    process.exit();
  }

  networkConfig.peers = networkConfig.network.peers;
  networkConfig.users = networkConfig.network.users;

  setup();
  //
  printNetworkDetails();
  // //Check if chaincode is already deployed
  // //TODO: Deploy failures aswell returns chaincodeID, How to address such issue?
  if (fileExists(chaincodeIDPath)) {
    // Read chaincodeID and use this for sub sequent Invokes/Queries
    networkConfig.chaincodeID = fs.readFileSync(chaincodeIDPath, 'utf8');
  }
  console.log("\nFound chaincodeID " + networkConfig.chaincodeID );

  //     chain.getUser(newUserName, function(err, user) {
  //         if (err) throw Error(" Failed to register and enroll " + deployerName + ": " + err);
  //         userObj = user;
  //         // invoke();
  //         enrollAndRegisterUsers();
  //     });
  // } else {
  //     enrollAndRegisterUsers();
  // }
}








//init();


function setup() {
  // Determining if we are running on a startup or HSBN network based on the url
  // of the discovery host name.  The HSBN will contain the string zone.
  var isHSBN = networkConfig.peers[0].discovery_host.indexOf('secure') >= 0 ? true : false;
  var network_id = Object.keys(networkConfig.network.ca);
  networkConfig.caUrl = "grpcs://"
  + networkConfig.network.ca[network_id].discovery_host + ":"
  + networkConfig.network.ca[network_id].discovery_port;

  // Configure the KeyValStore which is used to store sensitive keys.
  // This data needs to be located or accessible any time the users enrollmentID
  // perform any functions on the blockchain.  The users are not usable without
  // This data.
  var uuid = network_id[0].substring(0, 8);
  networkConfig.chain.setKeyValStore(hfc.newFileKeyValStore(__dirname + '/keyValStore-' + uuid));

  if (isHSBN) {
    networkConfig.certFile = '0.secure.blockchain.ibm.com.cert';
  }
  fs.createReadStream(networkConfig.certFile).pipe(fs.createWriteStream(networkConfig.certPath));
  var cert = fs.readFileSync(networkConfig.certFile);

  networkConfig.chain.setMemberServicesUrl(networkConfig.caUrl, {
    pem: cert
  });

  networkConfig.peerUrls = [];
  networkConfig.eventUrls = [];
  // Adding all the peers to blockchain
  // this adds high availability for the client
  for (var i = 0; i < networkConfig.peers.length; i++) {
    // Peers on Bluemix require secured connections, hence 'grpcs://'
    networkConfig.peerUrls.push("grpcs://" + networkConfig.peers[i].discovery_host + ":" + networkConfig.peers[i].discovery_port);
    networkConfig.chain.addPeer(networkConfig.peerUrls[i], {
      pem: cert
    });
    networkConfig.eventUrls.push("grpcs://" + networkConfig.peers[i].event_host + ":" + networkConfig.peers[i].event_port);
    networkConfig.chain.eventHubConnect(networkConfig.eventUrls[0], {
      pem: cert
    });
  }
  networkConfig.newUserName = networkConfig.config.user.username;
  // Make sure disconnect the eventhub on exit
  process.on('exit', function() {
    networkConfig.chain.eventHubDisconnect();
  });
}

function printNetworkDetails() {
  console.log("\n------------- ca-server, peers and event URL:PORT information: -------------");
  console.log("\nCA server Url : %s\n", networkConfig.caUrl);
  for (var i = 0; i < networkConfig.peerUrls.length; i++) {
    console.log("Validating Peer%d : %s", i, networkConfig.peerUrls[i]);
  }
  console.log("");
  for (var i = 0; i < networkConfig.eventUrls.length; i++) {
    console.log("Event Url on Peer%d : %s", i, networkConfig.eventUrls[i]);
  }
  console.log("");
  console.log('-----------------------------------------------------------\n');
}


/**
@param userName the name of the user we will enroll
@param enrollAttr an array containing the attributes the user will be enrolled
with, e.g. [{name:'typeOfUser',value:'University'}];
**/
function enrollAndRegisterUsers(userName,enrollAttr) {
  return new Promise(function(resolve,reject){
    try{
      // Enroll a 'admin' who is already registered because it is
      // listed in fabric/membersrvc/membersrvc.yaml with it's one time password.
      networkConfig.chain.enroll(networkConfig.users[0].enrollId,
        networkConfig.users[0].enrollSecret, function(err, admin) {
          if (err) reject("\nERROR: failed to enroll admin : " + err) ;
          // throw Error("\nERROR: failed to enroll admin : " + err);

          console.log("\nEnrolled admin sucecssfully");

          // Set this user as the chain's registrar which is authorized to register other users.
          networkConfig.chain.setRegistrar(admin);

          // let enrollAttr = [{name:'typeOfUser',value:'University'}];
          //creating a new user

          var registrationRequest = {
            enrollmentID: userName,
            affiliation: networkConfig.config.user.affiliation,
            attributes: enrollAttr
          };


          networkConfig.chain.registerAndEnroll(registrationRequest, function(err, user) {
            if (err) reject(" Failed to register and enroll " + userName + ": " + err);//throw Error(" Failed to register and enroll " + networkConfig.newUserName + ": " + err);

            console.log("\nEnrolled and registered " + userName + " successfully");
            userObj = user;
            //setting timers for fabric waits
            // chain.setDeployWaitTime(config.deployWaitTime);
            networkConfig.chain.setDeployWaitTime(400);
            networkConfig.chain.setInvokeWaitTime(30);
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





  /**
  @param userObj the user object obtained after enrolling a user
  @param a deploy request object, e.g.
  var deployRequest = {
  // Function to trigger
  fcn: networkConfig.config.deployRequest.functionName,
  // Arguments to the initializing function
  args: args,
  chaincodePath: networkConfig.config.deployRequest.chaincodePath,
  // the location where the startup and HSBN store the certificates
  certificatePath: networkConfig.network.cert_path
};
**/
function deployChaincodeWithParams(userObj,deployReq) {

  return new Promise(function(resolve,reject){
    // Trigger the deploy transaction
    var deployTx = userObj.deploy(deployReq);

    // Print the deploy results
    deployTx.on('complete', function(results) {
      // Deploy request completed successfully
      chaincodeID = results.chaincodeID;
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



/**
@param the userObj that is returned after a scuessful enrollement of a user
@param the invokation request, e.g. invokeRequest = {
//     // Name (hash) required for invoke
//     chaincodeID: networkConfig.chaincodeID,
//     // Function to trigger
//     fcn: networkConfig.config.invokeRequest.functionName,
//     // Parameters for the invoke function
//     args: args
// };
**/
function invokeWithParams(userObj,invReq) {

    var txHash="qwe";

    return new Promise(function(resolve,reject){
      var eh = networkConfig.chain.getEventHub();
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
        // Invoke transaction submission failed
        console.log(util.format("\nFailed to submit chaincode invoke transaction: request=%j, error=%j", invReq, err));
        reject(err);
      });

      //Listen to custom events
      var regid = eh.registerChaincodeEvent(invReq.chaincodeID, "evtsender", function(event) {
        console.log(util.format("Custom event received, payload: %j\n", event.payload.toString()));

        if(event.payload && event.payload.toString().indexOf("Error") >= 0){
          let uuid = event.payload.toString().split(".")[1];
          eh.unregisterChaincodeEvent(regid);
          if(uuid === txHash){ //resolve promise only when the current transaction has finished
            eh.unregisterChaincodeEvent(regid);
            reject(event.payload.toString());
          }
        }
        if(event.payload && event.payload.toString().indexOf("Tx chaincode finished OK") >= 0){
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










function getArgs(request) {
  var args = [];
  for (var i = 0; i < request.args.length; i++) {
    args.push(request.args[i]);
  }
  return args;
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}
