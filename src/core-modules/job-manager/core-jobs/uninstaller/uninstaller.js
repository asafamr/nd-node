
'use strict';
var core=require('../../../../duck-core');
var logger=core.dRequire('logger');
var jobManager=core.dRequire('job-manager');


jobManager.registerJobType('uninstaller',startJob);

function CreateUninstallerJob(where,onEnd)
{
	onEnd();
}

function startJob(where,onEnd)
{
	return new CreateUninstallerJob(where,onEnd);
}