'use strict';

var mod={};
module.exports=mod;
mod.createModule=createModule;
mod.getName=function(){return '$config';};
mod.$inject=['$uiActions','$state'];

var _ =require('lodash');

function createModule(backendInstance,$uiActions,$state)
{
		var installerStage='install';
		var config={};
		// loads the config object above
		console.log(backendInstance.getConfigPath());
		require(backendInstance.getConfigPath())(getLoadingInterface());

		var configModule={};
		configModule.getConfig=getConfig;
		configModule.getPageNames=getPageNames;
		configModule.getPage=getPage;
		configModule.getInstallerStage=function(){return installerStage;};
		registerUiActions();
		return configModule;

		function registerUiActions()
		{
			$uiActions.registerAction('getPageNames',[],getPageNames);
			$uiActions.registerAction('getPage',['name'],getPage);
		}
		function parseStateStrings(val)
		{
			if(_.isString(val))
			{
				return $state.parseTemplate(val);
			}
			return val;
		}
		function getConfig(path)
		{
			return _.cloneDeep(_.get(config[installerStage],path),parseStateStrings);
		}
		function getPage(name)
		{
			var pages=_.get(config,installerStage+'.pages');
			if(pages===undefined)
			{
				throw new Error('no pages for '+installerStage);
			}
			return _.find(pages,{name:name});
		}

		function getPageNames()
		{
			var pages=_.get(config,installerStage+'.pages');
			if(pages===undefined)
			{
				throw new Error('no pages for '+installerStage);
			}
			return _.pluck(pages,'name');
		}
		function getLoadingInterface()
		{
			return {
				initConfig:function(v){config=v;}
			};
		}
}
