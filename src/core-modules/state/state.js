'use strict';

var mod={};
module.exports=mod;
mod.createModule=createModule;
mod.getName=function(){return '$state';};
mod.$inject=['$uiActions'];

var _ =require('lodash');

function createModule($uiActions)
{
  var state={};
  var stateModuleInstance={};
  stateModuleInstance.getSettings=getSettings;
  stateModuleInstance.setSettings=setSettings;
  stateModuleInstance.parseTemplate=parseTemplate;
  registerUiActions();
  return stateModuleInstance;
  function registerUiActions()
  {
    $uiActions.registerAction('setUserSettings',['key','value'],
    function(key,val)
    {
      setSettings('userSettings.'+key,val);
    });
  }
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
