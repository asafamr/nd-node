'use strict';

var mod={};
module.exports=mod;
mod.createModule=createModule;
mod.getName=function(){return '$fs';};
mod.$inject=['$uiActions'];

var path=require('path');

function createModule($uiActions)
{

		var fsModule={};
		fsModule.getWorkingDir=getWorkingDir;
    activate();
		return fsModule;

    function activate()
    {
      registerUiActions();
    }

		function registerUiActions()
		{
			$uiActions.registerAction('getWorkingDir',[],getWorkingDir);
		}
		function getWorkingDir()
		{
      return process.cwd();
		}



}
