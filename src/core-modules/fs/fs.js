'use strict';

module.exports=createModule;
createModule.moduleName='$fs';
createModule.$inject=['$uiActions'];


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
