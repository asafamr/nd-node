/**
@name fs module
@description file system operations
**/
'use strict';

var fs=require('fs-extra');
var BBPromise=require('bluebird');

module.exports=createModule;
createModule.moduleName='$fs';
createModule.$inject=['$uiActions','$logger'];


function createModule($uiActions,$logger)
{

	var fsModule={};
	fsModule.getWorkingDir=getWorkingDir;
	fsModule.isDirValid=isDirValid;
	fsModule.isDirEmpty=isDirEmpty;
	activate();
	return fsModule;

	function activate()
	{
		registerUiActions();
	}

	function registerUiActions()
	{
		$uiActions.registerAction('fs_getWorkingDir',[],getWorkingDir);
		$uiActions.registerAction('fs_isDirValid',['dir'],isDirValid);
		$uiActions.registerAction('fs_isDirEmpty',['dir'],isDirEmpty);
	}
	/**
	* @name getWorkingDir
	* @description registered as uiAction fs_getWorkingDir
	* @return current working dir
	**/
	function getWorkingDir()
	{
		return process.cwd();
	}

	function isDirValid(dir)
	{
		return BBPromise.promisify(fs.stat)(dir).then(function(res)
		{
			if(res.isFile())
			{
				return false;
			}
		}).catch(function(err)
		{
			$logger.debug('isDirValid returned '+err);
			return false;
		});
	}
	function isDirEmpty(dir)
	{
		return BBPromise.promisify(fs.readdir)(dir).then(function(res)
		{
			if(res.length>0)
			{
				return false;
			}
			return true;
		});
	}



}
