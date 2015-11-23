'use strict';

//var _=require('lodash');
var BBPromise=require('bluebird');

module.exports=createModule;
createModule.moduleName='$notifications';
createModule.$inject=['$uiActions'];

function createModule($uiActions)
{
	var notificationsModule={};
	notificationsModule.getNotificationsFromIdx=getNotificationsFromIdx;
	notificationsModule.pushNotification=pushNotification;
	var notificationsQueue=[];
	registerUiActions();
	return notificationsModule;

	function registerUiActions()
	{
		$uiActions.registerAction('getNotificationsFromIdx',['idx'],getNotificationsFromIdx);
	}

	function getNotificationsFromIdx(idx)
	{
		return new BBPromise(function(resolve,reject)
		{
			void reject;
			var fromIdx=Math.max(notificationsQueue.length,idx);
			resolve(notificationsQueue.splice(0,fromIdx));
		});
	}

	function pushNotification(name,value)
	{
		notificationsQueue.push({name:name,value:value,time: Date.now()});
	}

}
