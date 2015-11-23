'use strict';

var backendInstance={};
module.exports=backendInstance;
backendInstance.create=create;//function create(ndConfigPath,logger)

var logger= require('./logger');
var path= require('path');
var _= require('lodash');
var BBPromise= require('bluebird');
var fs= require('fs');
var moduleLoader= require('./module-loader');

var coreModules=
[
	'config',
	'ui-actions',
	'notifications',
	'state',
	'job',
	'pages',
	'fs',
	'utils'
	/*'job-manager',
  'nd-fs',
	'',
	'*/
];


function create(ndConfigPath)
{
	var loadedModules={};
	var newBackendInstance={};
	newBackendInstance.startLoad=startLoad;
	newBackendInstance.registerModule=registerModule;
	newBackendInstance.registerModulesDir=registerModulesDir;
  newBackendInstance.getConfigPath=function(){return ndConfigPath;};
	newBackendInstance.hasFinishedLoading=function(){return finishedLoading;};
  newBackendInstance.getModule=function(name){return loadedModules[name];};


	//private params

	var moduleLoaders=[];
	var startedLoading=false;
	var finishedLoading=false;

  return newBackendInstance;

  /***
  startLoad - sort modules according to dependencies, loads them and wait for their actions registration
  ***/
	function startLoad()
	{
			if(startedLoading)
			{
				logger.debug('ND-node startLoad called more than once');
				return;
			}
			startedLoading=true;

			coreModules.forEach(function (moduleName){
				moduleLoaders.push(moduleLoader.getLoader(getCoreModulePath(moduleName)));
			});
			moduleLoaders.push(moduleLoader.getLoader({instance:logger,moduleName:'$logger'}));
			moduleLoaders.push(moduleLoader.getLoader({instance:newBackendInstance,moduleName:'$backend'}));

      //var modules=getModulesAndDependencies(modulePaths);
      moduleLoaders=moduleLoader.getSortedByDepends(moduleLoaders);

			var modulePromises={};

      //we will augment each module in modules with .instance - a member containg a promise returning its instance
      moduleLoaders.forEach(
  			function(moduleLoader)
  			{
						//we init each module instance promise then create it when all dependcies are ready
						modulePromises[moduleLoader.name]=new BBPromise(function (resolve){
		            var args=
		              _.map(moduleLoader.dependencies,
		                function(name){ return modulePromises[name];}
		              );//concat all dependencies

									resolve(BBPromise.all(args).then(//all dependencies have ben created - create this module now
			              function(argValues)
			              {
											logger.debug('Creating an instace of '+moduleLoader.name);
											var factoryRet=moduleLoader.factory.apply(newBackendInstance,argValues);
											if(!factoryRet)
											{
												throw new Error('xxxxx');
												loadedModules[moduleLoader.name]={};
												return BBPromise.resolve({});
											}
											return BBPromise.resolve(factoryRet).then(function(instResolved)
											{
												loadedModules[moduleLoader.name]=instResolved;
												return instResolved;
											});

			              }
			            ));
						});
  			}
			);

      //wait for all loading to complete and update status
      return BBPromise.all(_.values(modulePromises)).then(
        function()
        {
          logger.debug('finished loading modules');
          finishedLoading=true;
        }
      );

	}


	function registerModule(ndjsModule)
	{
			var loader= moduleLoader.getLoader(ndjsModule);
      logger.debug('registering a custom module ' +loader.name);
			moduleLoaders.push(loader);
	}
	function registerModulesDir(dirPath)
	{
		var files=fs.readdirSync(dirPath);
		files.forEach(function(filename)
			{
				if(filename.indexOf('.js')!==-1)
				{
					registerModule(path.join(dirPath,filename));
				}
			});
	}


}




function getCoreModulePath(moduleName)
{
  return path.normalize(__dirname+'/core-modules/'+moduleName+'/'+moduleName);
}
