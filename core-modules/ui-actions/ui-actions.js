
'use strict';

var logger=require('../logger/logger');

module.exports={};
module.exports.registerAction=registerAction;
module.exports.getRegisteredActions=getRegisteredActions;
module.exports.callAction=callAction;


var uiActions={};
function getRegisteredActions()
{
	return JSON.parse( JSON.stringify( uiActions ) );
}

function registerAction(name,paramNames,action){
	uiActions[name]={name:name,paramNames:paramNames,action:action};
}


function callAction(name,paramArray,callback){
	if(name!=='getNotificationsFromIdx')//this just flood the log
	{
		logger.debug('callUiAction '+name +', '+ JSON.stringify(paramArray));
	}
	if(!Array.isArray(paramArray))
	{
		paramArray = Object.keys(paramArray).map(function (key) {return paramArray[key];});
	}
	var fail=function (err)
	{
		callback( new Error(err));
		return 'failed';
	};
	if(!uiActions.hasOwnProperty(name))
	{
		logger.debug('No UI Action named '+name);
		return fail('No UI Action named '+name,null);
	}
	if(paramArray.length!==uiActions[name].paramNames.length)
	{
		logger.error('Wrong number of arguments passed to '+name);
		return fail('Wrong number of arguments passed to '+name);
	}


	uiActions[name].action.apply(null,paramArray.concat([callback]));
	return 'ok';
}