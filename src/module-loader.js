'use strict';

var moduleLoader={};
moduleLoader.getLoader=getLoader;
moduleLoader.getSortedByDepends=getSortedByDepends;
module.exports=moduleLoader;

var _=require('lodash');
var toposort= require('toposort');
var anonCounter=0;
function getAnonymousName()
{
  var newName='AnonymousModule'+anonCounter;
  anonCounter++;
  return newName;
}
function getLoaderFromFullModule(obj)
{
  var dependencies=[];
  var name=obj.moduleName;
  if(!name)
  {
    name = getAnonymousName();
  }
  if(obj.$inject)
  {
    dependencies=obj.$inject;
  }
  return {factory:obj,name:name,dependencies:dependencies};
}
function getLoader(ndjsModule)
{
  //we support 3 kinds of inputs:   path to factory module(implements createModule,getName)
  //                                factory object(implements createModule,getName)
  //                                singleton instance(implements getName,instance)

  if(_.isString(ndjsModule))//path to module
  {
    var requiredModule;
    try {
      requiredModule=require(ndjsModule);
    } catch (e) {
        throw new Error('Error while trying to load '+ndjsModule +': '+e);
    }
    if(typeof requiredModule !== 'function')
    {
      throw new Error('Module '+ndjsModule +' does not return a factory function');
    }
    return getLoaderFromFullModule(requiredModule);

  }
  else if(typeof ndjsModule === 'function'){
    return getLoaderFromFullModule(ndjsModule);
  }
  else if(ndjsModule.moduleName && ndjsModule.instance)
  {//if this is a singleton instance it needs to have a name to be injected
    var factory=function(){return ndjsModule.instance;};
    return {factory:factory,name:ndjsModule.moduleName,dependencies:[]};
  }
  else {
    throw new Error('Module format invalid');
  }
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
