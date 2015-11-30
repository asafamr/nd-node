'use strict';

module.exports=createModule;
createModule.moduleName='$job';
createModule.$inject=['$uiActions','$config','$logger','$backend','$notifications'];

var _ =require('lodash');
var BBPromise =require('bluebird');
var path=require('path');

function createModule($uiActions,$config,$logger,$backend,$notifications)
{
  var jobTypes={};
  var jobQueue={};

  var jobModule={};
  var failedJobs=[];
  jobModule.getAllJobs=getAllJobs;
  jobModule.registerJobType=registerJobType;
  jobModule.getRegisteredJobTypes=getRegisteredJobTypes;
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
      //'shortcut',
      'multi'];
      coreJobs.forEach(function(jobName)
      {
        loadJobFromFile(path.normalize(__dirname+'/core-jobs/'+jobName));
      });
      function loadJobFromFile(jobFilePath)
      {
        var jobType=require(jobFilePath);
        registerJobType(jobType);
      }
    }
    function registerUiActions()
    {
      $uiActions.registerAction('getAllJobs',[],getAllJobs);
      $uiActions.registerAction('startNamedJob',['name','force'],startNamedJob);
      $uiActions.registerAction('retryJob',['idx'],retryJob);
      $uiActions.registerAction('ignoreRetryJob',['idx'],ignoreRetryJob);
      $uiActions.registerAction('abortRetryJob',['idx'],abortRetryJob);
    }
    function getAllJobs()
    {
      return Object.keys(getJobsFromConfig());
    }
    function getRegisteredJobTypes()
    {
      return jobTypes;
    }
    function registerJobType(factory,setName)
    {
      var jobTypeName=setName;
      if(!jobTypeName && factory.jobType)
      {
        jobTypeName=factory.jobType;
      }
      if(!jobTypeName)
      {
        throw new Error('Job type does not have a name (.jobType property)');
      }
      if(jobTypes.hasOwnProperty(jobTypeName))
      {
        throw new Error('Job type '+name + ' alrady registered');
      }
      jobTypes[jobTypeName]=factory;
    }
    function retryJob(idx)
    {
      failedJobs[idx].pendingPromiseResolve( startJob(failedJobs[idx].jobType,failedJobs[idx].settings));
    }
    function ignoreRetryJob(idx)
    {
      failedJobs[idx].pendingPromiseResolve();
    }
    function abortRetryJob(idx)
    {
      failedJobs[idx].pendingPromiseResolve(BBPromise.reject('aborted'));
    }
    function startJob(jobType,settings)
    {
      if(!jobTypes.hasOwnProperty(jobType))
      {
        throw new Error('Job type '+jobType + ' unknown');
      }
      var jobPromise= jobTypes[jobType](settings,$logger,$backend);
      if(!jobPromise.then)
      {
        throw new Error('Job type '+jobType + '.create returned a non promise');
      }
      var jobPromiseErrorHandled=jobPromise.catch(function(err)
      {
        if(err.ndjsRetry)
        {
          var pending =new BBPromise(function(resolve){
            failedJobs.push({jobType:jobType,settings:settings,pendingPromiseResolve:resolve});
            var idx=failedJobs.length-1;
            $notifications.pushNotification('jobretry',{jobType:jobType,err:err.clientMessage,retryIdx:idx});
          });
          return pending;
        }
        else {
          $notifications.pushNotification('joberror',{jobType:jobType,error:err.toString()});
        }
        $logger.error('Job type '+jobType + ' error: '+err.stack);

      });
      //TODO: find a better, safer way to keep the getProgress - this is dangerous
      if(jobPromise.getProgress){jobPromiseErrorHandled.getProgress=jobPromise.getProgress;}
      if(jobPromise.shouldCancel){jobPromiseErrorHandled.shouldCancel=jobPromise.shouldCancel;}
      return jobPromiseErrorHandled;
    }
    function startNamedJob(name,force)
    {
      if(typeof force === 'undefined'){force=false;}
      var jobInConfig=getJobsFromConfig()[name];
      var type=jobInConfig.type;
      if(jobQueue.hasOwnProperty(name) && !force)
      {
        if(jobQueue[name].isFulfilled())
				{
          $logger.debug('Job start requestd for '+name + ' but it has already finished');
          $notifications.pushNotification('jobstatus',{jobName:name,progress:1});
          return;
				}
        else {
          throw new Error('Job '+name + ' already started');
        }
      }
      var job=startJob(type,jobInConfig.settings);

      //job start returned the full object - track progress
      if(job && job.hasOwnProperty('getProgress'))
      {
        jobQueue[name]=job;
        sendQueueReport();
        job.then(function(){
          $notifications.pushNotification('jobstatus',{jobName:name,progress:1});
        });
      }


    }
    function sendQueueReport()
    {
      var stillPendingJobs=false;
      _.forEach(jobQueue,function(promise,name){
        if(promise.isPending(promise))
        {
          stillPendingJobs=true;
          $notifications.pushNotification('jobstatus',{jobName:name,progress:promise.getProgress()});
        }
      });
      if(stillPendingJobs)
      {
        setTimeout(sendQueueReport,100);
      }
    }



  }
