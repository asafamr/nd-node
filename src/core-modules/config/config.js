/**
@name config module
@description gets configurations from ndjs file according to the current installer stage. parses templates through the state module
**/
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

		configModule.getInstallerStage=getInstallerStage;
		return configModule;

		/**
		* @name getInstallerStage
		* @return current installer stage ('install', 'uninstall' etc...)
		**/
		function getInstallerStage()
		{
			return installerStage;
		}
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
		/**
		* @name getConfig
		* @param path {String} property path
		* @return parsed value of the property if found
		* @example getConfig('pages[2]') will return the 3rd page in the current install stage
		**/
		function getConfig(path)
		{
			return cloneDeepAndParse(_.get(config[installerStage],path));
		}
		/**
		* @name getOutgoingDir
		* @return outgoing dir (should not be used on production)
		**/
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
