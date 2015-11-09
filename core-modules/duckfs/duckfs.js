'use strict';

var BPromise = require('bluebird');
var fs = require('fs-extra');
BPromise.promisifyAll(fs);

var core=require('../../nd-node');
var logger=core.dRequire('logger');

var path = require('path');



var duckFs={};


module.exports  = duckFs;
duckFs.createShortcut=createShortcut;
duckFs.getDirFiles=getDirFiles;
duckFs.getBaseDir=getBaseDir;


activate();

function activate()
{
	registerUiActions();
}

function createShortcut(params,callback)
{
	var ws = require('windows-shortcuts');
	callback();
	return;
	ws.create(params.from+'.lnk',{target:params.to},
						function(err)
						{
		if(err)
		{
			callback(err);
		}
		callback(null);

	});
}

function getDirFiles(dirPath,callback)
{
	var fileStats=[];
	fs.readdirAsync(dirPath)
		.then(function(files)
					{
		var statsPromises=[];
		files.forEach(
			function(file)
			{
				statsPromises.push(
					fs.statAsync(path.join(dirPath,file))
					.then(
						function(stat){
							var type=stat.isDirectory()?'dir':'file';
							fileStats.push({type:type,name:file});
						}

					).catch(function (err)

									{
						//todo: cleanup
						logger.error(err);}
								 ));


			});

		return BPromise.all(statsPromises);
	}).then(
		function(){
			callback(null,fileStats);
		}).catch(function(err)
						 {
		logger.error(err);
		callback(err);
	});
}

duckFs.getDirTree= function getDirTree(dirPath,callback)
{
	var dirs=[];
	var lastDir;
	var dir=dirPath;
	while(dir!==lastDir)
	{

		dirs.push(dir);
		lastDir=dir;
		dir=path.dirname(dir);
	}
	dirs=dirs.reverse();
	var dirContent={};
	var allDirsPromises=[];
	dirs.forEach(function(subdir){
		allDirsPromises.push(
			BPromise.promisify(duckFs.getDirFiles)(subdir)
			.then(
				function(files)
				{
					dirContent[subdir]=files.filter(function(x){return x.type==='dir';});
				}));});
	BPromise.all(allDirsPromises).then(
		function(){
			var builtTree={};
			var currentLeaf=builtTree;
			for(var subdir in dirs)
			{
				var dirName=dirs[subdir];
				var baseName=path.basename(dirName);
				currentLeaf[baseName]={};
				currentLeaf=currentLeaf[baseName];
				for (var subDir in dirContent[dirName])
				{
					var subDirName=dirContent[dirName][subDir].name;
					currentLeaf[subDirName]={};
				}
			}
			var finalTree={};
			finalTree[dirs[0]]=builtTree[''];
			return finalTree;
		})
		.catch(function(err){
		logger.error(new Error(err));
		callback(err);})
		.then(function(finalOut)
					{
		callback(null,finalOut);
	});

};

function getBaseDir(callback)
{
	callback(null,process.cwd());
}

function registerUiActions()
{
	var uiActions=core.dRequire('ui-actions');
	uiActions.registerAction('fsGetDirFiles',['dirPath'],duckFs.getDirFiles);
	uiActions.registerAction('fsGetWorkingDir',[],duckFs.getBaseDir);
	uiActions.registerAction('fsGetDirTree',['dirPath'],duckFs.getDirTree);
}
