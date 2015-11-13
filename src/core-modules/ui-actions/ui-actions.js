'use strict';

var _=require('lodash');
var BBPromise=require('bluebird');

var mod={};
module.exports=mod;
mod.getName=function(){return '$uiActions';};
mod.createModule=createModule;
mod.$inject=[];

function createModule(backendInstance)
{
	void backendInstance;
	var uiActionsModule={};
	uiActionsModule.registerAction=registerAction;
	uiActionsModule.getRegisteredActions=getRegisteredActions;
	uiActionsModule.runAction=runAction;
	var uiActions={};
	return uiActionsModule;
	/**
	@return mapping actionname -> [paramsName,...]
	**/
	function getRegisteredActions()
	{
			return _.cloneDeep(_.mapValues(uiActions,function(allData){return allData.paramNames;}));
	}
	/**
	register a new UI action
	**/
	function registerAction(name,paramNames,action)
	{
		uiActions[name]={name:name,paramNames:paramNames,action:action};
	}

	function runAction(name,paramArray)
	{
			return new BBPromise(function(resolve,reject)
			{
					/*if(name!=='getNotificationsFromIdx')//this just flood the log
					{
						$logger.debug('callUiAction '+name +', '+ JSON.stringify(paramArray));
					}*/
					/*if(!Array.isArray(paramArray))
					{
						paramArray = _.values(paramArray);
					}*/
					if(!uiActions.hasOwnProperty(name))
					{
						reject('No UI Action named '+name);
					}
					if(paramArray.length!==uiActions[name].paramNames.length)
					{
						reject('Wrong number of arguments passed to '+name);
					}
					resolve(uiActions[name].action.apply(null,paramArray));
			});
	}
}
