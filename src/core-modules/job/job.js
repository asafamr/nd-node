'use strict';

module.exports=createModule;
createModule.moduleName='$job';
createModule.$inject=['$uiActions','$config','$logger','$backend'];

var _ =require('lodash');
var path=require('path');

function createModule($uiActions,$config,$logger,$backend)
{
    var jobTypes={};
    var jobQueue={};

		var jobModule={};
		jobModule.getAllJobs=getAllJobs;
    jobModule.getRunningJobsProgress=getRunningJobsProgress;
    jobModule.registerJobType=registerJobType;
		jobModule.startJob=startJob;
		jobModule.startNamedJob=startNamedJob;
    activate();
		return jobModule;

    function activate()
    {
      registerUiActions();
      loadCoreJobTypes();
    }
    function getJobsFromConfig()
    {
      return $config.getConfig('jobs');
    }
    function loadCoreJobTypes()
    {
        var coreJobs=[
          'extract',
          'shortcut',
					'multi'];
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
			$uiActions.registerAction('startNamedJob',['name'],startNamedJob);
		}
		function getAllJobs()
		{
      return Object.keys(getJobsFromConfig());
		}
    function registerJobType(name,create)
    {
      if(jobTypes.hasOwnProperty(name))
      {
        throw new Error('Job type '+name + ' alrady registered');
      }
      jobTypes[name]=create;
    }
		function startJob(jobType,settings)
		{
			if(!jobTypes.hasOwnProperty(jobType))
      {
          throw new Error('Job type '+jobType + ' unknown');
      }
			var jobPromise= jobTypes[jobType](settings,$logger,$backend);
      if(!('then' in jobPromise))
      {
        throw new Error('Job type '+jobType + '.create returned a non promise');
      }
      return jobPromise;
		}
    function startNamedJob(name)
		{
      //we support two kind of return values from job type start:
      //either full object with getProgress,getPromise,cancel(optional)
      //or just a return value/throw error for instant jobs
			var jobInConfig=getJobsFromConfig()[name];
      var type=jobInConfig.type;
      if(false&& jobQueue.hasOwnProperty(name))
      {
          throw new Error('Job '+name + ' alrady started');
      }
      var job;
      try {
        job=startJob(type,jobInConfig.settings);
      } catch (e) {
      	$logger.error(e+e.stack);
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
