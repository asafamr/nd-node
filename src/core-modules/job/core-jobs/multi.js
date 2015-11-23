'use strict';
var BBPromise=require('bluebird');

var jobType={};
module.exports=jobType;
jobType.getName=function(){return 'multi';};
jobType.create=create;

function create(settings,logger,$backend)
{
  var jobPromise=getPromise();
  jobPromise.cancel=cancel;
  var currentJobMeta=settings.subJobs[0];
  var currentJobPromise=null;
  var canceled=false;


  return jobPromise;


  function getPromise()
  {
    return BBPromise.each(settings.subJobs,function(subJob){
        if(canceled)
        {
          return;
        }
        currentJobMeta=subJob;
        currentJobPromise=$backend.getModule('$job').startJob(subJob.type,subJob.settings);
        return currentJobPromise;
    });
  }
  function cancel()
  {
    canceled=true;
    if(currentJobPromise && currentJobPromise.cancel)
    {
      currentJobPromise.cancel();
    }
  }

  function getEstimatedTime(job)
  {
    void job;
    return 1;
  }

  function getProgress()
  {
    var totalTime=0;
    var doneTime=0;
    var jobsDone=true;
    settings.subJobs.forEach(function(subJob)
  {
    var estimated=getEstimatedTime(subJob);
    totalTime+=estimated;
    if(subJob===currentJobMeta)
    {
      var progress= currentJobInstance.hasOwnProperty(getProgress) && currentJobInstance.getProgress() || 0;
      doneTime+=progress*estimated;
      jobsDone=false;
    }
    else if(jobsDone){
      doneTime+=estimated;
    }
    return Math.min(Math.max( doneTime/totalTime,0),1);

  });
  }
}
