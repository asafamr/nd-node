'use strict';

var core=require('../../nd-node');
var path=require('path');
var _ =require('lodash');
var logger=core.dRequire('logger');
var BPromise=require('bluebird');

var jobManager={};
module.exports  = jobManager;

jobManager.registerJobType=registerJobType;
jobManager.startJob=startJob;
jobManager.getJobProgress=getJobProgress;
jobManager.cancelJob=cancelJob;

var registeredJobTypes={};
var runningJobs={};
//var jobCounter=0;

activate();

function activate()
{
	jobManager.registerJobType('multi',startMutli,estimateMultiJob);

	core.registerOnLoad(function(){
		return new BPromise(function (resolve, reject) {
			logger.debug('started loading core jobs');
			var duckFs=core.dRequire('duckfs');
			duckFs.getDirFiles(
				path.resolve(__dirname,'core-jobs')
				,function(err,files)
				{
					if(err)
					{
						throw err;d
					}

					files.forEach(function(file){
						logger.debug('loading core job '+file.name);
						if(file.type==='dir')
						{
							require(path.resolve(__dirname,'core-jobs',file.name,file.name));
						}

					});
					logger.debug('finished loading core jobs');
					resolve();


				});
		}).then(function(){setTimeout(SendProgressToUi,500);});

		function SendProgressToUi()
		{
			setTimeout(SendProgressToUi,500);
			var notif=core.dRequire('notifications');
			//var installerConfig=core.dRequire('installer-config');

			Object.keys(runningJobs).forEach(function(jobName)
																			 {
				var jobItem=runningJobs[jobName];
				var progressDone = jobItem.getProgress();
				notif.pushNotification('JobProgress',{jobName:jobName,progress:progressDone,estimateLeft:jobItem.getTotalEstimate()*(1-progressDone)});

			});
		}


	});

	var uiActions=core.dRequire('ui-actions');
	uiActions.registerAction('startJob',['jobName'],startJob);
	uiActions.registerAction('cancelJob',['jobName'],cancelJob);
	uiActions.registerAction('getJobProgress',['jobName'],getJobProgress);

}


function startJob(name)
{
	logger.debug('startJob: starting job '+name);
	var installerCongfig=core.dRequire('installer-config');
	var theJob=installerCongfig.getJobWithName(name);

	if(!theJob.hasOwnProperty('type'))
	{
		theJob.type='multi';
	}

	if(runningJobs.hasOwnProperty(name))
	{
		throw new Error('Job named ' + name + ' already running');
	}

	runningJobs[name]=new RunningJobItem(theJob,function()
																									{
		var notif=core.dRequire('notifications');
		notif.pushNotification('JobDone',{jobName:name});
		delete runningJobs[name];

	});
	//jobManager.startJob(name,theJob.type,theJob,function () {logger.debug('job ' + name + ' done.');});
}

function registerJobType(jobTypeName,startCallback,estimateFunction)
{
	if(registeredJobTypes.hasOwnProperty(jobTypeName))
	{
		throw new Error('Job type already registered '+jobTypeName);
	}

	var finalEstimateFunction=_.isFunction(estimateFunction)?estimateFunction:function(){return 0;};
	logger.debug('registering job type '+jobTypeName );
	registeredJobTypes[jobTypeName]={start:startCallback,estimate:finalEstimateFunction};
}

function RunningJobItem(config,onEndCallback)
{
	if(!registeredJobTypes.hasOwnProperty(config.type))
	{
		throw new Error('No job type named '+config.type);
	}

	this.jobInstance=registeredJobTypes[config.type].start(
		config,onEndCallback);
	this.getProgress=this.jobInstance.getProgress;
	if(this.getProgress===null)
	{
		this.getProgress=function(){return 0;};
	}

	this.cancel=this.jobInstance.cancel;
	if(this.cancel===null)
	{
		this.cancel=function(){logger.debug(config.type+' does not support cancel');};
	}

	this.getTotalEstimate=function()
	{
		return registeredJobTypes[config.type].estimate(config);
	};

}

function getJobProgress(jobName)
{
	if(!runningJobs.hasOwnProperty(jobName))
	{
		throw new Error('No job named '+jobName);
	}
	return runningJobs[jobName].getProgress();
}

function cancelJob(jobName)
{
	if(!runningJobs.hasOwnProperty(jobName))
	{
		throw new Error('No job named '+jobName);
	}
	return runningJobs[jobName].cancel();
}






function estimateMultiJob(config)
{
	//logger.debug('--$estimating '+JSON.stringify(config));
	var totalTime=0;
	for(var i=0;i<config.settings.length;i++)
		{
			totalTime+=registeredJobTypes[config.settings[i].type].estimate(config.settings[i]);
		}
	//logger.debug('--%  '+totalTime);
	return totalTime;
}
function MutliJob(config,onEnd)
{
	var myCurrentSubJobIdx=0;
	var getRunningJobProgress=null;
	this.getProgress=getProgress;

	BPromise.reduce(config.settings,function(myIdx,subJob){
		return new BPromise(function(resolve, reject) {
			myCurrentSubJobIdx=myIdx;

			var thisJob=new  RunningJobItem(subJob,resolve);
			getRunningJobProgress=thisJob.getProgress;
		}
											 );},0).then(onEnd);

	function getProgress(){

		var totalTime=estimateMultiJob(config);
		var totalDone=0;
		for(var i=0;i<config.settings.length;i++)
		{
			//logger.debug('estimating '+JSON.stringify(config.settings[i]));
			var thisJobEst=registeredJobTypes[config.settings[i].type].estimate(config.settings[i]);

			if(i<myCurrentSubJobIdx)
			{
				totalDone+=thisJobEst;
			}
			else if(i===myCurrentSubJobIdx)
			{
				if(getRunningJobProgress!==null)
				{
					totalDone+=thisJobEst*getRunningJobProgress();
				}
			}
		}
		if(totalTime===0)
		{
			return 1;
		}
		var fractDone=(totalDone)/totalTime;
		return Math.max(Math.min(fractDone,1),0);
	}
}

function startMutli(config,onEnd)
{
	return new MutliJob(config,onEnd);
}
