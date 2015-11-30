'use strict';

module.exports=createModule;
createModule.moduleName='$state';
createModule.$inject=['$uiActions','$logger'];

var _ =require('lodash');

function createModule($uiActions,$logger)
{
  var state={user:{}};
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
      setSettings('user.'+key,val);
    });
  }
  function getSettings(settingsPath,defaultValue)
  {
    var got= _.get(state,settingsPath,defaultValue);
    if(!got && !defaultValue)
    {
      $logger.warn('requested settings '+settingsPath +' missing and no default value supplied');
    }
    return got;
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
