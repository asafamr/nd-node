/**
@name fs module
@description file system operations
**/
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
		/**
		* @name getWorkingDir
		* @return current working dir 
		**/
		function getWorkingDir()
		{
      return process.cwd();
		}



}
