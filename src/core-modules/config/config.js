'use strict';

module.exports=createModule;
createModule.moduleName='$config';
createModule.$inject=['$backend','$state'];

var _ =require('lodash');
var path =require('path');


function createModule($backend,$state)
{
		var installerStage='install';
		var config={};
		// loads the config object above
		require($backend.getConfigPath())(getLoadingInterface());

		var configModule={};
		configModule.getConfig=getConfig;
		configModule.getOutgoingDir=getOutgoingDir;
		configModule.getInstallerStage=function(){return installerStage;};
		return configModule;

		function cloneDeepAndParse(val)
		{
			if(_.isPlainObject(val))
			{
				return _.mapValues(val,cloneDeepAndParse);
			}
			else if(_.isArray(val))
			{
				return _.map(val,cloneDeepAndParse);
			}
			else if (_.isString(val)) {
				return parseStateStrings(val);
			}
			return val;
		}
		function parseStateStrings(val)
		{
			var parsed=$state.parseTemplate(val);
			if(parsed!==val)
			{
				return parseStateStrings(parsed);
			}
			return val;
		}
		function getConfig(path)
		{
			return cloneDeepAndParse(_.get(config[installerStage],path));
		}
		function getOutgoingDir()
		{
			return path.resolve(config.options.outgoing);
		}

		function getLoadingInterface()
		{
			return {
				initConfig:function(v){config=v;}
			};
		}
}
