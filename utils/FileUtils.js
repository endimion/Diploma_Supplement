'use strict';

const fs = require('fs');
module.exports.readFilePromise = readFilePromise;



function readFilePromise(path){
  return new Promise( (resolve,reject) =>{
    fs.readFile(path, function (err, data) {
      if (err){
         reject(err);
      }else{
          // console.log("the data is " + data);
          resolve(data);
      }
    });

  });
}
