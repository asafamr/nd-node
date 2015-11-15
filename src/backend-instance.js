'use strict';

var backendInstance={};
module.exports=backendInstance;
backendInstance.create=create;//function create(ndConfigPath,logger)

var logger= require('./logger');
var path= require('path');
var _= require('lodash');
var toposort= require('toposort');
var BBPromise= require('bluebird');

var coreModules=
[
	'config',
	'ui-actions',
	'notifications'
	/*'job-manager',
  'nd-fs',
	'',
	'*/
];


function create(ndConfigPath)
{

	var newBackendInstance={};
	newBackendInstance.startLoad=startLoad;
	newBackendInstance.registerModule=registerModule;
  newBackendInstance.getConfigPath=function(){return ndConfigPath;};
  newBackendInstance.hasFinishedLoading=function(){return finishedLoading;};


	//private params

	var modulePaths=_.map(coreModules,getCoreModulePath);
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


      var modules=getModulesAndDependencies(modulePaths);
      var modulesLoadOrder=getModulesLoadOrder(modules);
      modules.$logger={module:null,dependencies:[],instance:logger};
      //we will augment each module in modules with .instance - a member containg a promise returning its instance
      modulesLoadOrder.forEach(
  			function(moduleName)
  			{
						//we init each module instance promise then create it when all dependcies are ready
						modules[moduleName].instancePromise=new BBPromise(function (resolve){
	            var requiredModule=modules[moduleName].module;
	            if(!requiredModule)
	            {
	              throw new Error('Module '+requiredModule +' missing');
	            }

	            var args=[newBackendInstance];//first argument is this new instance

	            args=args.concat(
	              _.map(modules[moduleName].dependencies,
	                function(name){ return modules[name].instancePromise;}
	              ));//concat all dependencies

	            BBPromise.all(args).then(
	              function(argValues)
	              {
	                //apply the createModule with the dependencies
									var inst=modules[moduleName].module.createModule.apply(newBackendInstance,argValues);
									BBPromise.resolve(inst).then(function(instResolved)
									{
										modules[moduleName].instance=instResolved;
										resolve(instResolved);
									});

	              }
	            );
						});
  			}
			);

      //wait for all loading to complete and update status
      return BBPromise.all(_.pluck(modules,'instancePromise')).then(
        function()
        {
          logger.debug('finished loading modules');
          finishedLoading=true;
        }
      );

	}


	function registerModule(path)
	{
      logger.debug('registering a custom module '+ path);
			modulePaths.push(path);
	}


}

/**
@param modules returned by getModulesAndDependencies : keys are module names, values are {module:module,depends:[<depends>]}
@return  array of module names topologically sorted by dependencies(dependencies comes before dependents)
**/
function getModulesLoadOrder(modules)
{
    var graphEdges=[];

    //add graphEdges each is like [depnds,dependency]
    _.forEach(modules,function(moduleAndDepends,moduleName)
    {
      if(moduleAndDepends.dependencies===[])
      {
        graphEdges.push(['{}',moduleName]);
      }
      else {
        moduleAndDepends.dependencies.forEach(
          function(dependency)
          {
            if(!modules.hasOwnProperty(dependency))
            {
              throw new Error('Module '+dependency + ' not found and is required by '+moduleName);
            }
            graphEdges.push([dependency,moduleName]);
          }
        );
      }
    });

    var modulesLoadOrder=[];
    try {
      modulesLoadOrder=_.filter(toposort(graphEdges),function(x){return x!=='{}';});//remove {} (the base of the graph)
    } catch (e) {
      throw new Error('Modules dependency order error: ' +e);
    }
    return modulesLoadOrder;
}

/**
@param modulePaths array of paths to modules to be require()ed
@return  an object : keys are module names, values are {module:module,depends:[<depends>]}
**/
function getModulesAndDependencies(modulePaths)
{
  var ret={};
  modulePaths.forEach(
    function(modulePath)
    {
        var requiredModule=require(modulePath);
        //modules need to implement .getName() and create() method
        if(!requiredModule.hasOwnProperty('getName') || !/^[0-9a-zA-Z$]+$/.test(requiredModule.getName()))
        {
          throw new Error('Module '+modulePath + ' getName() does not return a valid module name');
        }
        var moduleName=requiredModule.getName();

        if(!requiredModule.hasOwnProperty('createModule'))
        {
          throw new Error('Module '+moduleName + ' does not implement createModule()');
        }

        //assert moudle name uniqueness
        if(ret.hasOwnProperty(moduleName))
        {
          throw new Error(moduleName +' has already registered');
        }

        var dependencies=[];

        if(requiredModule.hasOwnProperty('$inject'))
        {
            dependencies=requiredModule.$inject;
        }

        ret[moduleName]={module:requiredModule,dependencies:dependencies};
    });
    return ret;
}
function getCoreModulePath(moduleName)
{
  return path.normalize(__dirname+'/core-modules/'+moduleName+'/'+moduleName);
}
