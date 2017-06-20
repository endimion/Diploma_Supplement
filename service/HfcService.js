/*jslint es6 */
/*jslint node: true */
'use strict';
const basic = require('../basicFunctions');
const chainCodeQuery = require('../ChaincodeQuery.js');
const emailHelper = require('../utils/emailClient.js');
const srvUtils = require('../utils/serverUtils.js');
const supUtils = require('../utils/SupplementUtils.js');
const qr = require('qr-image');
const util = require('util');

exports.publishSupplement = function(owner, university, _id){
  // console.log(owner + university + _id);
  return new Promise(function(resolve,reject){
    let publishArgs = ['{"Owner":"'+ owner +'", "University":"'+university+'","Authorized":[],"Id":"'+_id+'"}' ];
    let _enrollAttr = [{name:'typeOfUser',value:'University'},{name:"eID",value:university.toString()}];
    let _invAttr = ['typeOfUser','eID'];
    let publishReq = {
      chaincodeID: basic.config.chaincodeID,
      fcn: "publish",
      args: publishArgs,
      attrs: _invAttr
    };

    let publishFnc = invokeCurryPromise(publishReq);
    // console.log("invokeCurryPromise");
    let tryToPublish = makeHfcCall(publishFnc,10,resolve,reject,university,_enrollAttr);
    tryToPublish();
  });

};



exports.removeInvites = function(userEid, supplementId, mailsArray){
  let mailString = "";
  mailsArray.forEach( (mail,index) => {
    mailString += mail+";";
  });
  console.log(mailString)  ;
  // console.log(owner + university + _id);
  return new Promise(function(resolve,reject){
    let removeArgs = [supplementId,mailString];
    let _enrollAttr = [{name:'typeOfUser',value:'Student'},{name:"eID",value:userEid}];
    let _invAttr = ['typeOfUser','eID'];
    let removeReq = {
      chaincodeID: basic.config.chaincodeID,
      fcn: "uninvite",
      args: removeArgs,
      attrs: _invAttr
    };
    let fnc = invokeCurryPromise(removeReq);
    // console.log("invokeCurryPromise");
    makeHfcCall(fnc,10,resolve,reject,userEid,_enrollAttr)();
  });

};




exports.getSupplements = function(userEid, userType){
  return new Promise(function(resolve,reject){
    let queryArgs = [userEid];
    // let userName = req.session.eID;
    let _enrollAttr = [{name:'typeOfUser',value: userType},{name:"eID",value:userEid}];
    let queryAttributes = ['typeOfUser'];
    let testQ2 = new chainCodeQuery(queryAttributes, queryArgs, basic.config.chaincodeID,"getSupplements",basic.query);
    let testQfunc2 = testQ2.makeQuery.bind(testQ2);
    let success = function(response){
      resolve(JSON.parse(response));
    };
    // let enrollUser = basic.enrollAndRegisterUsers(userEid,_enrollAttr);

    let tryToGetSupplements = makeHfcCall(testQfunc2,10,success,reject,userEid,_enrollAttr);
    tryToGetSupplements();
  });
};


exports.getSupplementById = function(supId, userEid,userType){
  return new Promise(function(resolve,reject){
    let queryArgs = [supId];
    // let userName = req.session.eID;
    let _enrollAttr = [{name:'typeOfUser',value: userType},{name:"eID",value:userEid}];
    let queryAttributes = ['typeOfUser','eID'];
    let testQ2 = new chainCodeQuery(queryAttributes, queryArgs, basic.config.chaincodeID,"getSupplementById",basic.query);
    let testQfunc2 = testQ2.makeQuery.bind(testQ2);
    let success = function(response){
      resolve(JSON.parse(response));
    };
    // let enrollUser = basic.enrollAndRegisterUsers(userEid,_enrollAttr);

    let tryToGetSupplements = makeHfcCall(testQfunc2,10,success,reject,userEid,_enrollAttr);
    tryToGetSupplements();
  });
};




exports.getSupplementByHash = function(userEid, dsHash,userType){

    return new Promise(function(resolve,reject){
      let _enrollAttr = [{name:'typeOfUser',value:userType},{name:"eID",value:userEid}];
      let enrollUserFnc = basic.enrollAndRegisterUsers;
      let genCodeargs = [dsHash];
      let genCodeInvAttr = ['typeOfUser','eID'];
      let genCodeReq = {
        chaincodeID: basic.config.chaincodeID,
        fcn: "genCodeForDSMap",
        args: genCodeargs,
        attrs: genCodeInvAttr
      };

      let dsHashqAttr = ['typeOfUser','eID'];
      let dsHashargs = [dsHash];
      let getHashQ = new chainCodeQuery(dsHashqAttr, dsHashargs, basic.config.chaincodeID,"getDiplomaSupplementMapsByHash",basic.query);
      let getHashBound = getHashQ.makeQuery.bind(getHashQ);
      // let getHashAndUserBound = getHashQ.getResponseWithUser.bind(getHashQ);


      let tryToEmailCode = function(code, emailAddress){
        let emailBody = "<p> Your validation code is " + code + "</p>";
        return emailHelper.sendEmail(emailAddress,emailBody); //this is a promise
      }

      let genCodeFnc = invokeCurryPromise(genCodeReq);


      let tryToGenerateAndEmailCodeChain = function(user){
          return genCodeFnc(user).then( rsp => {return getHashBound(user)})
          .then(data => {
                let _data = JSON.parse(data);
                return tryToEmailCode(_data.Code,_data.Email);
          });
      };

    let genAndEmailSuccess = response =>{
        resolve( { title: 'Enter Validation Code',
        message: 'Welcome user: ' + userEid  + '\n'
        +'Please enter below the validation code you received via email'   ,
        userType: userType,
        dsHash: dsHash, view: 'validationCodeView'});
      };

    let tryToGenerateAndEmailCode = makeHfcCall(tryToGenerateAndEmailCodeChain,10,
                                    genAndEmailSuccess,reject,userEid,_enrollAttr);

    let getDSHash = function(user){
      let successFnc = function(rsp){
          console.log("\nsuccess");
          let result = JSON.parse(rsp);
          console.log(result);
          if(result.Recipient === ""){
            return tryToGenerateAndEmailCode(user);
          }else{
            let _qAttr = ['typeOfUser','eID'];
            let _args = [result.DSId];
            let getSup = new chainCodeQuery(_qAttr, _args, basic.config.chaincodeID,"getSupplementById",basic.query);
            let getSupB = getSup.makeQuery.bind(getSup);
            let successSupFnc = function(response){
              let supplement = JSON.parse(response);
              resolve({ title: 'View Supplement',
              message: 'Welcome user: ' + userEid , userType: userType,
              supplement: supplement,view: 'viewSingleSupplement'});
            }
            return getSupB(user).then(successSupFnc);//.then(resp => resolve(respose));
          }
      }
      return   getHashBound(user).then(successFnc)
    }
      makeHfcCall(getDSHash,10, (x) =>{x},reject,userEid,_enrollAttr)();
    });
};






exports.shareSupplement = function(employerEmail,supId,userEid, userType){
  return new Promise( (resolve,reject) => {
    let dsNonceHash = supUtils.generateSupplementHash(employerEmail, supId, userEid);
    let _enrollAttr = [{name:'typeOfUser',value:userType},{name:"eID",value:userEid}];
    let _invAttr = ['typeOfUser','eID'];
    let addDSMapArgs = ['{"DSHash":"'+dsNonceHash+'", "DSId":"'+supId+'", "Email":"'+employerEmail+'", "Recipient":null}' ];

    let emailBody = '<p>Click<a href="http://' + srvUtils.address + '/supplement/view/'
    +dsNonceHash +'"> here</a> to view the shared diploma supplement </p>';

    let addDSMapReq = {
      chaincodeID: basic.config.chaincodeID,
      fcn: "addDiplomaSupplementMap",
      args: addDSMapArgs,
      attrs: _invAttr
    };
    let addDSFnc = invokeCurryPromise(addDSMapReq);
    let addDSMap = function(user){
      return addDSFnc(user).then( resp => {emailHelper.sendEmail(employerEmail,emailBody);});
    }
    makeHfcCall(addDSMap,10,resolve,reject,userEid,_enrollAttr)();
  });
};


exports.shareSupplementQR = function(employerEmail,supId,userEid, userType){
  return new Promise( (resolve,reject) => {
    let dsNonceHash = supUtils.generateSupplementHash(employerEmail, supId, userEid);
    let _enrollAttr = [{name:'typeOfUser',value:userType},{name:"eID",value:userEid}];
    let _invAttr = ['typeOfUser','eID'];
    let addDSMapArgs = ['{"DSHash":"'+dsNonceHash+'", "DSId":"'+supId+'", "Email":"'+employerEmail+'", "Recipient":null}' ];
    let addDSMapReq = {
      chaincodeID: basic.config.chaincodeID,
      fcn: "addDiplomaSupplementMap",
      args: addDSMapArgs,
      attrs: _invAttr
    };
    let addDSFnc = invokeCurryPromise(addDSMapReq);

    let addDSMap = function(user){
      return addDSFnc(user);
    }
    let successFnc = function(result){
      let code = qr.image('http://'+srvUtils.address+ ':'+srvUtils.port+'/supplement/view/'+dsNonceHash, { type: 'svg' });
      // res.type('svg');
      // code.pipe(res);
      resolve(code);
    }

    makeHfcCall(addDSMap,10,successFnc,reject,userEid,_enrollAttr)();
  });
};








/**
* Wraps the invokation request to a promise and curries the fuction so as to take only the
*  user object as input.
@param invRequest, the invokation request object to publish a supplementRequest
*/
function invokeCurryPromise(invRequest){
  return function(user){
    return  new Promise(function(resolve,reject){
      console.log("will send invoke request:\n");
      console.log(invRequest);
      basic.invoke(user,invRequest)
      .then(rsp => {
        console.log("the response is: \n");
        console.log(rsp);
        resolve(rsp);
      }).catch(err => {
          console.log("the error is: \n");
        console.log(err);
        reject(err)
      });
    });
  }
}


/**
closure to include a counter, to attempt to publish for a max of 10 times;
  @param hfcFunc, the hyperledger function to call
  @param times, the times we will retry to call that function
  @param successCallback, function to call in case of successCallback
  @param failureCallback, function to call in case of failure
  @param user, the UserName of the user that will be enrolled
  @param enrollAttributes the attributes to enroll the user
**/
function makeHfcCall(hfcFunc,times,successCallback,failureCallback,user,enrollAttributes){
  return (function(){
      let counter = 0;
      // console.log("hfcFunc,times,retryFunction,successCallback,failureCallback");
      let innerFunction = function(){
          // firstStep(user,enrollAttributes)
          basic.enrollAndRegisterUsers(user,enrollAttributes)
          .then(hfcFunc)
          .then( rsp => {
            counter = times;
            successCallback(rsp);
          })
          .catch(err =>{
            if(counter < times){
              console.log("AN ERROR OCCURED!!! atempt:"+counter+"\n");
              console.log(err);
              counter ++;
              innerFunction();
            }else{
              console.log("HfcService");
              console.log(err);
              // failureCallback("failed, to get  supplements after " + counter + " attempts");
              try{
                let error = JSON.parse(util.format("%j",err));
                failureCallback(error.msg);
              }catch(e){
                console.log(e);
                failureCallback(util.format("%j",err));
              }
            }
          });
      };

      return innerFunction;
    })();
}
