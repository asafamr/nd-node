/**
@name notifications module
@description push notifications to UI
**/
'use strict';

//var _=require('lodash');
var BBPromise=require('bluebird');

module.exports=createModule;
createModule.moduleName='$notifications';
createModule.$inject=['$uiActions'];

function createModule($uiActions)
{
	var notificationsQueue=[];
	var notificationsListeners=[];

	var notificationsModule={};
	notificationsModule.getNotificationsFromIdx=getNotificationsFromIdx;
	notificationsModule.pushNotification=pushNotification;
	notificationsModule.listenToNotifications=listenToNotifications;
	registerUiActions();
	return notificationsModule;

	function registerUiActions()
	{
		$uiActions.registerAction('notifications_getFromIdx',['idx'],getNotificationsFromIdx);
	}
	/**
	* @name getNotificationsFromIdx
	* @description registered UI action
	* @param idx {Number}
	* @return get all notfications starting from this idx
	**/
	function getNotificationsFromIdx(idx)
	{
		return new BBPromise(function(resolve,reject)
		{
			void reject;
			var fromIdx=Math.max(notificationsQueue.length,idx);
			resolve(notificationsQueue.splice(0,fromIdx));
		});
	}
	/**
	* @name pushNotification
	* @description push notfications to UI and custom listeners
	* @param name {String} name of event
	* @param value {Object} event data
	* @example pushNotification('downloadComplete',{package:abc.zip})
	**/
	function pushNotification(name,value)
	{
		var notification={name:name,value:value,time: Date.now()};
		notificationsQueue.push(notification);
		notificationsListeners.forEach(function(listener)
		{
			listener(notification);
		});
	}

	/**
	* @name listenToNotifications
	* @description push notfications to a custom listener for easier server side global notifications
	* @param listener {Function} will be called with notification full data {name,value,time}
	* @example listenToNotifications(myCallback)
	**/
	function listenToNotifications(listener)
	{
		notificationsListeners.push(listener);
	}

}
