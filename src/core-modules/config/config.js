'use strict';

var mod={};
module.exports=mod;
mod.createModule=createModule;
mod.getName=function(){return '$config';};
mod.$inject=['$backend','$state'];

var _ =require('lodash');

function createModule($backend,$state)
{
		var installerStage='install';
		var config={};
		// loads the config object above
		require($backend.getConfigPath())(getLoadingInterface());

		var configModule={};
		configModule.getConfig=getConfig;
		configModule.getInstallerStage=function(){return installerStage;};
		return configModule;


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
			return _.cloneDeep(_.get(config[installerStage],path,parseStateStrings));
		}

		function getLoadingInterface()
		{
			return {
				initConfig:function(v){config=v;}
			};
		}
}
