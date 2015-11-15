'use strict';

var fs=require('fs');

var mod={};
module.exports=mod;
mod.getName=function(){return '$utils';};
mod.createModule=createModule;
mod.$inject=[];

function createModule(backendInstance)
{
	void backendInstance;
	var utilsModule={};
	utilsModule.getFileContent=getFileContent;
	utilsModule.isAlphanumeric=isAlphanumeric;
	return utilsModule;


  function getFileContent(path)
  {
    return fs.readFileSync(path).toString();
  }

  function isAlphanumeric(str)
  {
    return str && /^[0-9a-zA-Z]+$/.test(str);
  }

}
