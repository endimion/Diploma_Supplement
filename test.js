/*jslint es6 */
'use strict';

let basic  = require('./basicFunctions.js');
let ChainCodeQuery = require('./ChaincodeQuery.js');


// intialize the network configuartion
basic.init();



let attributes = ['typeOfUser'];
let enrollAttr = [{name:'typeOfUser',value:'University'}];
let args = ["a"];
let funcName = "query";
let testQ = new ChainCodeQuery(attributes, args, basic.config.chaincodeID,funcName,basic.query);
let testQfunc = testQ.makeQuery.bind(testQ);

let armgnts = ["a","b","10"];
let invokeRequest = {
  // Name (hash) required for invoke
  chaincodeID: basic.config.chaincodeID,
  // Function to trigger
  fcn: basic.config.config.invokeRequest.functionName,
  // Parameters for the invoke function
  args: armgnts
};


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
  chaincodePath: chaincodePath,
  // the location where the startup and HSBN store the certificates
  certificatePath: basic.config.network.cert_path
};



// actual tests



// testDeploy();
// testGetSupplements();
 // testPublishSupplement()
// testAddAuthorizedUser()
// testInvoke();
//
// testGetSupplementById();

// testAddDSMap();
// testGetDSMap();
// testAddDSMapReceipient();
// testGenCodeForDSMap();


function testDeploy(){
  basic.enrollAndRegisterUsers('deployer',enrollAttr)
  .then( user => {
    basic.deploy(user,deployRequest).then(res=> {console.log(res);
      process.exit(0);
    }).catch(err =>{
      console.log(err);
      process.exit(1);
    });
  }).catch(err =>{
    console.log(err);
  });
}


/**
  Test the default envoke function
**/
function testInvoke(){
  basic.enrollAndRegisterUsers(basic.config.newUserName,enrollAttr)
  .then(user => {
    basic.invoke(user,invokeRequest).then(res=> {console.log(res);
      process.exit(0);
    }).catch(err =>{
      console.log(err);
      process.exit(1);
    });
  }).catch(err =>{
    console.log(err);
  });
}


/**
  Test the publish tx, that deploys a DiplomaSupplement to the blockchain
**/
function testPublishSupplement(){
  let _id =  "12345";//Math.floor((Math.random() * 1000) + 1);
  let _args = ['{"Owner": "studentEid", "University":"ntua","Authorized":[],"Id":"'+_id+'"}' ];
  let _enrollAttr = [{name:'typeOfUser',value:'University'},{name:"eID",value:"ntua"}];
  let _invAttr = ['typeOfUser','eID'];
  let req = {
    // Name (hash) required for invoke
    chaincodeID: basic.config.chaincodeID,
    // Function to trigger
    fcn: "publish",
    // Parameters for the invoke function
    args: _args,
    //pass explicit attributes to teh query
    attrs: _invAttr
  };
  basic.enrollAndRegisterUsers("ntuaTestUser",_enrollAttr)
  .then(user => {
    basic.invoke(user,req).then(res=> {console.log(res);
      process.exit(0);
    }).catch(err =>{
      console.log(err);
      process.exit(1);
    });
  }).catch(err =>{
    console.log(err);
  });
}


/**
  Test the publish tx, that deploys a DiplomaSupplement to the blockchain
**/
function testAddDSMap(){
  let _id =  "12345";//Math.floor((Math.random() * 1000) + 1);
  let _args = ['{"DSHash": "hash1", "DSId":"12345","Email":"me@me.gr","Recipient":null}' ];
  let _enrollAttr = [{name:'typeOfUser',value:'Student'},{name:"eID",value:"studentEid"}];
  let _invAttr = ['typeOfUser','eID'];
  let req = {
    // Name (hash) required for invoke
    chaincodeID: basic.config.chaincodeID,
    // Function to trigger
    fcn: "addDiplomaSupplementMap",
    // Parameters for the invoke function
    args: _args,
    //pass explicit attributes to teh query
    attrs: _invAttr
  };
  basic.enrollAndRegisterUsers("testStd",_enrollAttr)
  .then(user => {
    basic.invoke(user,req).then(res=> {console.log(res);
      // process.exit(0);
    }).catch(err =>{
      console.log(err);
      process.exit(1);
    });
  }).catch(err =>{
    console.log(err);
  });
}


/**
  Test add a Recipient a DSHashMap
**/
function testAddDSMapReceipient(){
  let _id =  "12345";//Math.floor((Math.random() * 1000) + 1);
  let _args = ['hash1','recipientEid','5A989A9D6B'];
  let _enrollAttr = [{name:'typeOfUser',value:'Student'},{name:"eID",value:"studentEid"}];
  let _invAttr = ['typeOfUser','eID'];
  let req = {
    // Name (hash) required for invoke
    chaincodeID: basic.config.chaincodeID,
    // Function to trigger
    fcn: "addRecepientToDSMap",
    // Parameters for the invoke function
    args: _args,
    //pass explicit attributes to teh query
    attrs: _invAttr
  };
  basic.enrollAndRegisterUsers("testStd",_enrollAttr)
  .then(user => {
    basic.invoke(user,req).then(res=> {console.log(res);
      // process.exit(0);
    }).catch(err =>{
      console.log(err);
      process.exit(1);
    });
  }).catch(err =>{
    console.log(err);
  });
}



function testGenCodeForDSMap(){
  let _id =  "12345";//Math.floor((Math.random() * 1000) + 1);
  let _args = ['hash1'];
  let _enrollAttr = [{name:'typeOfUser',value:'Student'},{name:"eID",value:"studentEid"}];
  let _invAttr = ['typeOfUser','eID'];
  let req = {
    // Name (hash) required for invoke
    chaincodeID: basic.config.chaincodeID,
    // Function to trigger
    fcn: "genCodeForDSMap",
    // Parameters for the invoke function
    args: _args,
    //pass explicit attributes to teh query
    attrs: _invAttr
  };
  basic.enrollAndRegisterUsers("testStd",_enrollAttr)
  .then(user => {
    basic.invoke(user,req).then(res=> {console.log(res);
      // process.exit(0);
    }).catch(err =>{
      console.log(err);
      process.exit(1);
    });
  }).catch(err =>{
    console.log(err);
  });
}




/*

*/
function testQueries(){
  basic.enrollAndRegisterUsers(basic.config.newUserName,enrollAttr)
  .then(testQfunc).then(res =>{
    console.log("\nthe result is" + res);
    process.exit(0);
  })
  .then(res => {
    basic.enrollAndRegisterUsers("dummyUser",[])
    .then(testQfunc).then(res =>{
      console.log("\nthe result is" + res);
      process.exit(0);
    }).catch(err =>{
      console.log(err);
      process.exit(1);
    });

  })
  .catch(err =>{
    console.log(err);
    process.exit(1);
  });

}



function testGetSupplements(){
  let _args = ["ntua"];
  let testQ2 = new ChainCodeQuery(attributes, _args, basic.config.chaincodeID,"getSupplements",basic.query);
  let testQfunc2 = testQ2.makeQuery.bind(testQ2);
  basic.enrollAndRegisterUsers(basic.config.newUserName,enrollAttr)
  .then(testQfunc2).then(res =>{
    console.log("\nthe result is" + res);
    process.exit(0);
  })
  .catch(err =>{
    console.log("AN ERROR OCCURED!!!");
    console.log(err);
    if(err.toString().indexOf("Security handshake") > 0){
      console.log("there was a handshake error");
    }
    process.exit(1);
  });
}


function testGetDSMap(){
  let _args = ["be60905fd9b40388413a88b2cbe9371d5606b95d6b49c1d8543f02843763db94"];//hash1
  let testQ2 = new ChainCodeQuery(attributes, _args, basic.config.chaincodeID,"getDiplomaSupplementMapsByHash",basic.query);
  let testQfunc2 = testQ2.makeQuery.bind(testQ2);
  basic.enrollAndRegisterUsers(basic.config.newUserName,enrollAttr)
  .then(testQfunc2).then(res =>{
    console.log("\nthe result is" + res);
    process.exit(0);
  })
  .catch(err =>{
    console.log("AN ERROR OCCURED!!!");
    console.log(err);
    if(err.toString().indexOf("Security handshake") > 0){
      console.log("there was a handshake error");
    }
    process.exit(1);
  });
}



function testGetSupplementById(){
  let _args = ["12345"];
  let _enrollAttr = [{name:'typeOfUser',value:'Student'},{name:"eID",value:"studentEid"}];
  let _qAttr = ['typeOfUser','eID'];

  let testQ2 = new ChainCodeQuery(_qAttr, _args, basic.config.chaincodeID,"getSupplementById",basic.query);
  let testQfunc2 = testQ2.makeQuery.bind(testQ2);
  basic.enrollAndRegisterUsers("getSupplementUser",_enrollAttr)
  .then(testQfunc2).then(res =>{
    console.log("\nthe result is" + res);
    process.exit(0);
  })
  .catch(err =>{
    console.log("AN ERROR OCCURED!!!");
    console.log(err);
    if(err.toString().indexOf("Security handshake") > 0){
      console.log("there was a handshake error");
    }
    process.exit(1);
  });
}



function testAddAuthorizedUser(){
  let employer = "employerEid2";
  let supId = "12345";

  let _args = [supId,employer];
  let _enrollAttr = [{name:'typeOfUser',value:'Student'},{name:"eID",value:"studentEid"}];
  let _invAttr = ['typeOfUser','eID'];
  let req = {
    // Name (hash) required for invoke
    chaincodeID: basic.config.chaincodeID,
    // Function to trigger
    fcn: "addAuthorizedUser",
    // Parameters for the invoke function
    args: _args,
    //pass explicit attributes to teh query
    attrs: _invAttr
  };
  basic.enrollAndRegisterUsers("std01",_enrollAttr)
  .then(user => {
    basic.invoke(user,req).then(res=> {console.log(res);
      process.exit(0);
    }).catch(err =>{
      console.log(err);
      process.exit(1);
    });
  }).catch(err =>{
    console.log(err);
    process.exit(1);
  });
}


//
