/**
@name state module
@description installer stage - holds settings set from the UI
**/
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
	* @name getRegisteredActions
	* @description get currently registered UI actions
	* @return mapping action-name -> array of param-names
	**/
	function getRegisteredActions()
	{
			return _.cloneDeep(_.mapValues(uiActions,function(allData){return allData.paramNames;}));
	}
	/**
	* @name registerAction
	* @description register a new UI action
	* @param name {String} name of event
	* @param paramNames {Array} array of paramerter names
	* @param action {Function} callback of action( could be syncronous or retrun a pormise)
	* @example rregisterAction('notifications_getNotificationsFromIdx',['idx'],getNotificationsFromIdx)
	**/
	function registerAction(name,paramNames,action)
	{
		uiActions[name]={name:name,paramNames:paramNames,action:action};
	}

	/**
	* @name pushNotification
	* @description push notfications to UI
	* @param name {String} name of event
	* @param value {Object} sevent data
	* @example pushNotification('downloadComplete',{package:abc.zip})
	**/
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
					resolve(uiActions[name].action.apply(null,paramArray));
			}).then(function(result)
		{
			if(result!==false && !result)
			{
				return {};//so we always return a valid json
			}
			return result;
		});
	}
}
