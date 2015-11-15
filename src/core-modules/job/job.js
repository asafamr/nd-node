'use strict';

var mod={};
module.exports=mod;
mod.createModule=createModule;
mod.getName=function(){return '$job';};
mod.$inject=['$uiActions','$config'];

var _ =require('lodash');
var path=require('path');

function createModule(backendInstance,$uiActions,$config)
{
    var logger=backendInstance.getLogger();
		var configJobs={};
    var jobTypes={};
    var jobQueue={};

		var jobModule={};
		jobModule.getAllJobs=getAllJobs;
    jobModule.getRunningJobsProgress=getRunningJobsProgress;
    jobModule.registerJobType=registerJobType;
		jobModule.startJob=startJob;
    activate();
		return jobModule;

    function activate()
    {
      registerUiActions();
      loadCoreJobTypes();
      loadJobsFromConfig();
    }
    function loadJobsFromConfig()
    {
      configJobs=$config.getConfig('jobs');
    }
    function loadCoreJobTypes()
    {
        var coreJobs=[
          'sfx',
          'shortcut'];
        coreJobs.forEach(function(jobName)
        {
          loadJobFromFile(path.normalize(__dirname+'/core-jobs/'+jobName));
        });
        function loadJobFromFile(jobFilePath)
        {
          var jobType=require(jobFilePath);
          registerJobType(jobType.getName(),jobType.create);
        }
    }
		function registerUiActions()
		{
			$uiActions.registerAction('getAllJobs',[],getAllJobs);
      $uiActions.registerAction('getRunningJobsProgress',['name'],getRunningJobsProgress);
			$uiActions.registerAction('startJob',['name'],startJob);
		}
		function getAllJobs()
		{
      return Object.keys(configJobs);
		}
    function registerJobType(name,create)
    {
      if(jobTypes.hasOwnProperty(name))
      {
        throw new Error('Job type '+name + ' alrady registered');
      }
      jobTypes[name]=create;
    }
    function startJob(name,settings)
		{
      //we support two kind of return values from job type start:
      //either full object with getProgress,getPromise,cancel(optional)
      //or just a return value/throw error for instant jobs
      var type=configJobs[name].type;
      if(jobQueue.hasOwnProperty(name))
      {
          throw new Error('Job '+name + ' alrady started');
      }
      var job;
      try {
        job=startJob(jobTypes[type](settings,logger));
      } catch (e) {
        job=undefined;//job start throw error- mark as error
        jobQueue[name]={getProgress:function(){return 1;},cancel:null,status:'error',returnValue:''+e};
      }

      //job start returned the full object - track progress
      if(job && job.hasOwnProperty('getProgress'))
      {
        jobQueue[name]={getProgress:job.getProgress,cancel:job.cancel,status:'started'};
        job.getPromise().then(function(value)
        {
          jobQueue[name].status='finished';
          jobQueue[name].returnValue=value;
        })
        .error(function(err)
      {
        jobQueue[name].status='error';
        jobQueue[name].returnValue=''+err;
      });
      }
      else if(job){
        //job start returned instantly
        jobQueue[name]={getProgress:function(){return 1;},cancel:null,status:'finished',returnValue:job};

      }

		}

    function getRunningJobsProgress()
		{
      return _.map(jobQueue,function(val,key)
      {
        return {name:key,progress:val.getProgress()};
      });
		}


}
