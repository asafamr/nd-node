'use strict';

var mod={};
module.exports=mod;
mod.createModule=createModule;
mod.getName=function(){return '$state';};
mod.$inject=[];

var _ =require('lodash');

function createModule(backendInstance)
{
  void backendInstance;
  var state={};
  var stateModuleInstance={};
  stateModuleInstance.getSettings=getSettings;
  stateModuleInstance.setSettings=setSettings;
  stateModuleInstance.parseTemplate=parseTemplate;

  return stateModuleInstance;
  function getSettings(settingsPath,defaultValue)
  {
    return _.get(state,settingsPath,defaultValue);
  }
  function setSettings(settingsPath,value)
  {
    _.set(state,settingsPath,value);
  }
  function parseTemplate(str)
  {
    return _.template(str)(state);
  }
}
