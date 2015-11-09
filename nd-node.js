'use strict';

//require('process');
var BPromise = require('bluebird');
//var fse = require("fs");
//var walk = require('walk');
var path = require('path');
var logger=null;

//used to check if a module has already been required before
var requiredCached={'logger':true};
logger=dRequire('logger');


var duckCore =  {};
module.exports=duckCore;

var onLoadCallbacks=[];
var ready=false;
var coreLoaded=null;


duckCore.dRequire=dRequire;
duckCore.load=load;
duckCore.registerOnLoad=registerOnLoad;
duckCore.isLoaded=isLoaded;
duckCore.getAssetsDir=function(){return path.resolve(__dirname,'..','..','assets');};
duckCore.getUiActions=function(){return dRequire('ui-actions').getRegisteredActions();};
duckCore.getCallUiAction=function(){return dRequire('ui-actions').callAction;};
duckCore.getLogger=function(){return logger;};
activate();







function activate()
{
	//todo: move to onload
	coreLoaded= new BPromise(function (resolve, reject) {
	var duckFs=dRequire('duckfs');
	duckFs.getDirFiles(
		path.resolve(__dirname,'core-modules')
		,function(err,files)
		{
			if(err)
			{
				throw err;
			}
			files.forEach(function(file)
										{
				if(file.type==='dir')
				{
					dRequire(file.name);
				}

			});
			resolve();
		});
	});
}

function registerOnLoad(onLoadCallback)
{
	logger.debug('registering a callback');
	onLoadCallbacks.push(onLoadCallback);
}

function load()
{
	if(ready)
	{
		return;
	}
	var promises=[];

	coreLoaded.then(function()
									{
		logger.debug('loading '+ onLoadCallbacks.length +' registered callback(s)');
		onLoadCallbacks.forEach(function(cb){
			var ret=cb();
			if('then' in ret)
			{
				promises.push(ret);
			}});
		logger.debug(promises.length + ' promises');
		BPromise.all(promises).then(function(){
			logger.debug('finished loading');
			ready=true;
			dRequire('notifications').pushNotification('start','ok');
		});
	});

}


function dRequire(what)
{
	if(logger)
	{
		if(!requiredCached.hasOwnProperty(what))
		{
			requiredCached[what]=true;
			logger.debug('First require of '+what);
		}
	}
	var retModule=null;
	try {
		var fullPath=path.resolve(__dirname,'core-modules', what,what);
		retModule=require(fullPath);
	}
	catch (e) {
		logger.debug('dRequire exception: '+e );
		if(e.code==='MODULE_NOT_FOUND' && e.message.indexOf(what)>-1)
		{
			logger.debug('could not find module ' +what+' falling back to node require');
			return require(what);
		}
		throw e;
	}
	return retModule;
}

function isLoaded(){
	return ready;
}

