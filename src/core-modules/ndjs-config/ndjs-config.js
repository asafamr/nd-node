'use strict';

var ndjsConfig={};
module.exports=ndjsConfig;
ndjsConfig.createModule=createModule;
ndjsConfig.getName=function(){return '$config';};


//var path=require('path');
var _ =require('lodash');

function createModule(backendInstance,registerActionClosure)
{
		var logger=backendInstance.getLogger();
		//var utils=backendInstance.getUtils();

		var installerMode='install';

		var config=backendInstance.getConfig();

		registerActionClosure('getPages',getPages);

		function getPages()
		{
			var pages=_.property(installerMode+'.pages')(config);
			if(pages===undefined)
			{
				logger.error('Pages for installer mode '+installerMode + ' missing');
				return [];
			}
			return pages;
		}

}

/*
var endClientSettings={};


var joinedSettings =Object.create(installerConfig);
joinedSettings.user=endClientSettings;
joinedSettings.duck={};
joinedSettings.duck.desktop='C:\\Users\\asafa\\Desktop';
var installerStage='install';


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
}*/
