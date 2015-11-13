'use strict';
var utils={};
module.exports=utils;

var fs=require('fs');

utils.getFileContent=getFileContent;
utils.isAlphanumeric=isAlphanumeric;





function getFileContent(path)
{
  return fs.readFileSync(path).toString();
}

function isAlphanumeric(str)
{
  return str && /^[0-9a-zA-Z]+$/.test(str);
}
