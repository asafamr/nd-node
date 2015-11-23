'use strict';

var _=require('lodash');
var BBPromise=require('bluebird');

module.exports=createModule;
createModule.moduleName='$uiActions';
createModule.$inject=[];

function createModule()
{
	var uiActionsModule={};
	uiActionsModule.registerAction=registerAction;
	uiActionsModule.getRegisteredActions=getRegisteredActions;
	uiActionsModule.callAction=callAction;
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

	function callAction(name,paramArray)
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
						reject('No Action named '+name);
						return;
					}
					if(paramArray.length!==uiActions[name].paramNames.length)
					{
						reject('Wrong number of arguments passed to '+name);
						return;
					}
					var ret;
					try{
						ret=uiActions[name].action.apply(null,paramArray);
					}
					catch(e)
					{
						reject(e);
						return;
					}

					if(!ret){resolve('ok');}
					resolve(ret);
			});
	}
}
