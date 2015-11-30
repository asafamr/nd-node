'use strict';

var fs=require('fs');
var BBPromise=require('bluebird');
var _=require('lodash');

module.exports=createModule;
createModule.moduleName='$utils';
createModule.$inject=[];

function createModule(backendInstance)
{
	void backendInstance;
	var utilsModule={};
	utilsModule.getFileContentSync=getFileContentSync;
	utilsModule.setXmlFileProps=setXmlFileProps;
	utilsModule.isAlphanumeric=isAlphanumeric;
	utilsModule.runShellCmdAndDetach=runShellCmdAndDetach;
	return utilsModule;

	function runShellCmdAndDetach(cmd,argArray,cwd)
	{
		return  new BBPromise(function(resolve)
	 {
		var spawn = require('child_process').spawn;
		//var out = fs.openSync('./out.log', 'a'),
    //var err = fs.openSync('./out.log', 'a');
		var options={detached:true,stdio: [ 'ignore', 'ignore', 'ignore' ]};
		if(cwd)
		{
			options.cwd=cwd;
		}


		spawn(cmd,argArray, options).unref();
 	 setTimeout(resolve,100);//takes some time to detach
  });
	}

  function setXmlFileProps(pathToFile,propsMappings)
	{
		return BBPromise.promisify(fs.readFile)(pathToFile,'utf8').then(
			function(fileContent)
		{
			var xpath = require('xpath');
	    var dom = require('xmldom').DOMParser;
			var doc = new dom().parseFromString(fileContent);
			_.forEach(propsMappings,function(val,key)
		{
			var nodes = xpath.select(key, doc);
				_.forEach(nodes,function(node)
			{
				if(node.nodeType===2)//atribbutes
				{
					node.value=''+val;
				}
				else if(node.nodeType===3)//text
				{
					node.data=''+val;
				}
				else
				{
					node.value=''+val;
				}
			});
		});
		return doc.toString();

		}).then(function(newFileContent)
	{
		return BBPromise.promisify(fs.writeFile)(pathToFile,newFileContent);
	});
	}

  function getFileContentSync(path)
  {
    return fs.readFileSync(path).toString();
  }

  function isAlphanumeric(str)
  {
    return str && /^[0-9a-zA-Z]+$/.test(str);
  }

}
