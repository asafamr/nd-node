'use strict';
var path=require('path');
var core=require('../../nd-node');
var _ =require('lodash');
var logger=core.dRequire('logger');


var endClientSettings={};
var installerConfig={};

var joinedSettings =Object.create(installerConfig);
joinedSettings.user=endClientSettings;
joinedSettings.duck={};
joinedSettings.duck.desktop='C:\\Users\\asafa\\Desktop';
var installerStage='install';
module.exports=installerConfig;

//installerConfig.getConfigFile=getConfigFile;
installerConfig.getJobWithName=getJobWithName;
installerConfig.getInstallerStage=getInstallerStage;
installerConfig.getExpandedValue=getExpandedValue;
installerConfig.getUnexpandedValue=getUnexpandedValue;
installerConfig.setUserSettings=setUserSettings;
installerConfig._expandTemplate=expandTemplate;



activate();


function activate()
{
	var assetsDir=core.getAssetsDir();
	installerConfig= require(path.resolve(assetsDir,'installConfig.json'));
	if(installerConfig.hasOwnProperty('installerStage'))
	{
		installerStage=installerConfig.installerStage;
	}

	var uiActions=core.dRequire('ui-actions');
	logger.debug('registering config actions');
	uiActions.registerAction('setUserSettings',['settingsDictionary'],setUserSettings);	
	uiActions.registerAction('getPages',[],getCurrentStagePages);
}

function getCurrentStagePages(callback)
{
	logger.debug('getCurrentStagePages');
	callback(null,installerConfig[installerStage].pages);
}
function expandTemplate(str,data)
{
	//var joined =installerConfig;
	//joined.user=endClientSettings;
	
	var lastStr='';
	while(lastStr!==str)
	{
		if(lastStr!=='')
		{
			logger.debug('expanding '+str);
		}
		lastStr=str;
		str=_.template(str)(data);
	}
	return lastStr;
}
function getExpandedValue(key)
{
	return expandTemplate(getUnexpandedValue(key),joinedSettings);
}
function getUnexpandedValue(key)
{
	return _.get(joinedSettings, key);
}


function setUserSettings(settingsDictionary,callback)
{
	endClientSettings= _.merge(endClientSettings,settingsDictionary);
	callback();
}


function getInstallerStage()
{
	return installerStage;
}

function getJobWithName(name)
{
	var jobs=installerConfig[installerStage].jobs;
	for(var i=0;i<jobs.length;i++)
	{
		if(jobs[i].hasOwnProperty('name') && jobs[i].name===name)
		{
			return _.cloneDeep(jobs[i],function(item){if(_.isString(item)){return expandTemplate(item,joinedSettings);}});
		}
	}
	var errorStr='could not find job named ' + name + ' in '+installerStage;
	throw new Error(errorStr);
}
