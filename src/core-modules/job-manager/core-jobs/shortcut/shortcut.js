
'use strict';
var core=require('../../../../duck-core');
var logger=core.dRequire('logger');

var jobManager=core.dRequire('job-manager');


jobManager.registerJobType('shortcut',startJob);

function ShortcutJob(config,onEnd)
{
	var duckfs=core.dRequire('duckfs');

	this.getProgress=function(){return 1;};
	duckfs.createShortcut(config,function(err){
		if(err)
		{
			logger.error('error in shortcut job:'+err);
			throw err;
		}
		onEnd();
	});
}

function startJob(config,onEnd)
{
	logger.debug('new shortcut job:'+JSON.stringify(config));
	return new ShortcutJob(config,onEnd);
}