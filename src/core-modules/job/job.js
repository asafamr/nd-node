/**
@name job module
@description job queue operations
**/
'use strict';

module.exports=createModule;
createModule.moduleName='$job';
createModule.$inject=['$uiActions','$config','$logger','$backend','$notifications'];


function createModule($uiActions,$config,$logger,$backend,$notifications)
{
  var jobTypes={};
  var jobQueue={};
  var canceledJobs={};

  var pendingCounter=0;
  var pendingQueue={};

  var jobModule={};

  jobModule.getAllJobs=getAllJobs;
  jobModule.registerJobType=registerJobType;
  jobModule.getRegisteredJobTypes=getRegisteredJobTypes;
  jobModule.startJob=startJob;
  jobModule.startNamedJob=startNamedJob;
  jobModule.cancelNamedJob=cancelNamedJob;
  jobModule.releasePendingJob=releasePendingJob;

  activate();
  return jobModule;

  function activate()
  {
    registerUiActions();
  }
  function getJobsFromConfig()
  {
    return $config.getConfig('jobs');
  }

  function registerUiActions()
  {
    $uiActions.registerAction('job_getAllJobs',[],getAllJobs);
    $uiActions.registerAction('job_startNamedJob',['name','force'],startNamedJob);
    $uiActions.registerAction('job_cancelNamedJob',['name'],cancelNamedJob);
    $uiActions.registerAction('job_releasePendingJob',['id','answer'],releasePendingJob);
  }
  /**
  * @name getAllJobs
  * @description registered as UI action
  * @return return all jobs names from the current install stage in ndfile
  **/
  function getAllJobs()
  {
    return Object.keys(getJobsFromConfig());
  }
  /**
  * @name getRegisteredJobTypes
  * @return all registered job types and creation callbacks
  **/
  function getRegisteredJobTypes()
  {
    return jobTypes;
  }
  /**
  * @name getAllJobs
  * @param path {String} property path
  * @return parsed value of the property if found
  * @example getConfig('pages[2]') will return the 3rd page in the current install stage
  **/
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
  /**
  * @name startJob
  * @param jobType {String} type of job to strart
  * @param settings {Object} settings of job instance
  * @param callbackProgress {Function} callback to report progress - should pass a number between 0(no progress) and 1 (job done)
  * @param callbackCancelCalled {Function} callback to be called for checking if job cancel was asked - should return true if should cancel
  * @param callbackPend {Function} callback to be called when job is waiting for user decisions. check copy core job for refernce
  * @return promise of the new job or throws error
  * @example startJob('extract',{'files':[{'from':'a','to':'b','size':109}]}) will start extracting from a to b
  **/
  function startJob(jobType,settings,callbackProgress,callbackCancelCalled,callbackPend,callbackAbort)
  {
    if(!jobTypes.hasOwnProperty(jobType))
    {
      throw new Error('Job type '+jobType + ' unknown');
    }
    var jobPromise= jobTypes[jobType](settings,callbackProgress,callbackCancelCalled,callbackPend,callbackAbort);
    if(!jobPromise.then)
    {
      throw new Error('Job type '+jobType + '.create returned a non promise');
    }
    return jobPromise;
  }

  /**
  * @name cancelNamedJob
  * @description registered UI action - signal to cancel a job - does not force anything
  * @param name {String} job name
  * @example cancelNamedJob('main');
  **/
  function cancelNamedJob(name)
  {
    canceledJobs[name]=true;
  }
  /**
  * @name releasePendingJob
  * @description registered UI action - release a job pending for user decisions
  * @param id {Number} id got from job_pending notification
  * @param answer {String} action to take - also in job_pending notification
  * @param options {Object} additional argument to send
  * @example releasePendingJob(2,'ignore',{});
  **/
  function releasePendingJob(id,answer,options)
  {
    pendingQueue[id][answer](options);
    delete pendingQueue[id];
  }
  /**
  * @name startNamedJob
  * @description registered UI action
  * @param name {String} name of job in ndfile.js
  * @param force {Boolean} start even if the job was started
  * @return parsed value of the property if found
  * @example startNamedJob(main') will start job 'main' of the current install stage
  **/
  function startNamedJob(name,force)
  {
    if(typeof force === 'undefined'){force=false;}
    var jobInConfig=getJobsFromConfig()[name];
    if(!jobInConfig)
    {
      $logger.error('Job '+name + ' was not found in configuration');
      throw new Error('Job '+name + ' was not found in configuration');
    }
    var type=jobInConfig.type;
    if(jobQueue.hasOwnProperty(name) && !force)
    {
      if(jobQueue[name].isFulfilled())//it is a promise
      {
        $logger.debug('Job start requestd for '+name + ' but it has already finished');
        $notifications.pushNotification('job_status',{jobName:name,progress:1});
        return;
      }
      else {
        throw new Error('Job '+name + ' already started');
      }
    }
    if(canceledJobs.hasOwnProperty(name))
    {
      delete canceledJobs[name];
    }

    var callbackProgress=function(progress)
    {
      $notifications.pushNotification('job_status',{jobName:name,progress:progress});
    };
    var callbackCancelCalled=function()
    {
      return canceledJobs.hasOwnProperty(name);
    };
    var jobWasAborted=false;
    var callbackAbort=function()
    {
      $notifications.pushNotification('job_aborted',{jobName:name});
      jobWasAborted=true;
      return;
    };
    var callbackPend=function(message,detailed,options)
    {
      pendingCounter++;
      var id='Pending'+pendingCounter;
      pendingQueue[id]=options;
      $notifications.pushNotification('job_pending',{jobName:name,message:message,detailed:detailed,pendingId:id,options:Object.keys(options)});
    };
    var job=startJob(type,jobInConfig.settings,callbackProgress,callbackCancelCalled,callbackPend,callbackAbort);
    job.then(function(){
      if(!jobWasAborted){
      callbackProgress(1);}
      //delete jobQueue[name];//should we delete? TODO:rethink
    }).catch(function(err)
  {
    if(!jobWasAborted)// if a job return this token its not marked as failed but as aborted
    {
      $logger.error('job failed: '+name+ ' '+err + (err.stack || ''));
      $notifications.pushNotification('job_failed',{jobName:name,details:''+err});
    }
    //delete jobQueue[name];//should we delete? TODO:rethink
  });
    jobQueue[name]=job;

  }
}
