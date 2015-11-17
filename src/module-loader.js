'use strict';

var moduleLoader={};
moduleLoader.getLoader=getLoader;
moduleLoader.getSortedByDepends=getSortedByDepends;
module.exports=moduleLoader;

var _=require('lodash');
var fs=require('fs');
var toposort= require('toposort');

function getLoader(ndjsModule)
{
  //we support 3 kinds of inputs:   path to factory module(implements createModule,getName)
  //                                factory object(implements createModule,getName)
  //                                singleton instance(implements getName,instance)
  var dependencies=[];
  var factory=null;
  var name='';

  if(_.isString(ndjsModule))//path to module
  {
    var requiredModule;
    try {
      requiredModule=require(ndjsModule);
    } catch (e) {
        throw new Error('Module '+ndjsModule +' could not be found');
    }

    if(!requiredModule.createModule)
    {
      throw new Error('Module '+ndjsModule +' does not implement createModule');
    }
    if(!requiredModule.getName)
    {
      throw new Error('Module '+ndjsModule +' does not implement getModuleName');
    }
    if(requiredModule.$inject)
    {
      dependencies=requiredModule.$inject;
    }
    factory=requiredModule.createModule;
    name=requiredModule.getName();
  }
  else if(ndjsModule.createModule){
    if(!ndjsModule.getName)
    {
      throw new Error('Module does not implement getModuleName');
    }
    if(ndjsModule.$inject)
    {
      dependencies=ndjsModule.$inject;
    }
    factory=ndjsModule.createModule;
    name=ndjsModule.getName();
  }
  else if(ndjsModule.getName && ndjsModule.instance)
  {
    name=ndjsModule.getName();
    factory=function(){return ndjsModule.instance;};
  }
  else {
    throw new Error('Module format invalid');
  }
  return {factory:factory,name:name,dependencies:dependencies};

}

/**
@param moduleLoaders array of moduleLoader s
@return  array of module loaders topologically sorted by dependencies(dependencies comes before dependents)
**/
function getSortedByDepends(moduleLoaders)
{
    var graphEdges=[];
		var modulesByName=_.indexBy(moduleLoaders,'name');
    //add graphEdges each is like [depnds,dependency]
    _.forEach(moduleLoaders,function(moduleLoader)
    {
      if(moduleLoader.dependencies===[])
      {
        graphEdges.push(['{}',moduleLoader.name]);
      }
      else {
        moduleLoader.dependencies.forEach(
          function(dependency)
          {
            if(!modulesByName.hasOwnProperty(dependency))
            {
              throw new Error('Module '+dependency + ' not found and is required by '+moduleLoader.name);
            }
            graphEdges.push([dependency,moduleLoader.name]);
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

    return _.map(modulesLoadOrder,function(moduleName){return modulesByName[moduleName];});
}
