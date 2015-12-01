/**
@name state module
@description installer stage - holds settings set from the UI
**/
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
  /**
	* @name getSettings
	* @param settingsPath {String} property path of the settings
	* @param defaultValue {Object} defualt value to be returned of property not found
	* @return current value of .settingsPath or defaultValue if not found
	**/
  function getSettings(settingsPath,defaultValue)
  {
    var got= _.get(state,settingsPath,defaultValue);
    if(!got && !defaultValue)
    {
      $logger.warn('requested settings '+settingsPath +' missing and no default value supplied');
    }
    return got;
  }
  /**
	* @name setSettings
	* @description setUserSettings ui actions calls this function with .user prefix. this functions set current state
	* @param settingsPath {String} name of event
	* @param value {Object}
	**/
  function setSettings(settingsPath,value)
  {
    _.set(state,settingsPath,value);
  }
  /**
	* @name parseTemplate
	* @param str {String} name of event
	* @return lodash template parsed value of str according to current state
	**/
  function parseTemplate(str)
  {
    return _.template(str)(state);
  }
}
