/**
@name multi corejob
@description run sub jobs one after the other

**/
'use strict';
var BBPromise=require('bluebird');

module.exports=create;
create.jobType='multi';

function create(settings,logger,$backend)
{
  var jobPromise=getPromise();
  jobPromise.shouldCancel=shouldCancel;
  var currentJobMeta=settings.subJobs[0];
  var currentJobPromise=null;
  var canceled=false;
  jobPromise.getProgress=getProgress;

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
  function shouldCancel()
  {
    canceled=true;
    if(currentJobPromise && currentJobPromise.shouldCancel)
    {
      currentJobPromise.shouldCancel();
    }
  }



  function getProgress()
  {
    var totalDone=0;

    var jobsDone=true;
    var eachProgress=1.0/settings.subJobs.length;
    settings.subJobs.forEach(function(subJob)
    {
      if(!currentJobPromise)
      {
        return;
      }
      if(subJob===currentJobMeta)
      {
        var progress= currentJobPromise.hasOwnProperty('getProgress') && currentJobPromise.getProgress() || 0;
        totalDone+=progress*eachProgress;
        jobsDone=false;
      }
      else if(jobsDone){
        totalDone+=eachProgress;
      }


    });
     return totalDone;
  }
}
