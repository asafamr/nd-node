'use strict';

var core=require('../../nd-node');
var logger=core.dRequire('logger');


var notificationsQueue=[];

var notifications={};
module.exports=notifications;

//installerConfig.getConfigFile=getConfigFile;
notifications.getNotificationsFromIdx=getNotificationsFromIdx;
notifications.pushNotification=pushNotification;

activate();

function activate()
{
	var uiActions=core.dRequire('ui-actions');
	uiActions.registerAction('getNotificationsFromIdx',['idx'],getNotificationsFromIdx);	
}

function getNotificationsFromIdx(idx,callback)
{
	var fromIdx=Math.max(notificationsQueue.length,idx);
	callback(null, notificationsQueue.splice(0,fromIdx));
}

function pushNotification(name,value)
{
	notificationsQueue.push({name:name,value:value,time: Date.now()});
}

