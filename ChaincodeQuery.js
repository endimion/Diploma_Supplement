'use strict';

module.exports = class  ChainCodeQuery{
  constructor(attributes, args,chaincodeId,functionName,queryFunction){
    this.attributes = attributes;
    this.args = args;
    this.chaincode = chaincodeId;
    this.functionName = functionName;
    this.queryFunction = queryFunction;
  }
  makeQuery(user){
    let that = this;
    let queryRequest = {
      // Name (hash) required for query
      chaincodeID: that.chaincode,
      // Function to trigger
      fcn: that.functionName,
      // Existing state variable to retrieve
      args: that.args,
      //pass explicit attributes to teh query
      attrs: that.attributes
    };
    return this.queryFunction(user,queryRequest,this.attributes);
  }

  getResponseWithUser(user){
    let that = this;
    let queryRequest = {
      // Name (hash) required for query
      chaincodeID: that.chaincode,
      // Function to trigger
      fcn: that.functionName,
      // Existing state variable to retrieve
      args: that.args,
      //pass explicit attributes to teh query
      attrs: that.attributes
    };
    return {"user":user,"promise":this.queryFunction(user,queryRequest,this.attributes)};
  }


}
