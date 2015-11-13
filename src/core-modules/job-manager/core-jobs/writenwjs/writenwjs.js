
'use strict';
var core=require('../../../../duck-core');
var logger=core.dRequire('logger');
var jobManager=core.dRequire('job-manager');


jobManager.registerJobType('writenw',startJob);

function WriteNWJob(where,onEnd)
{
	onEnd();
}

function startJob(where,onEnd)
{
	return new WriteNWJob(where,onEnd);
}