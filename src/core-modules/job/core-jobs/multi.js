/**
@name multi corejob
@description run sub jobs one after the other
@param subjobs {Array}
@example {type:"multi",settings:{subJobs:[{another-job1},{another-job2}]}
**/
'use strict';

module.exports=createModule;
createModule.moduleName='$job_multi';
createModule.$inject=['$job','$logger'];

var BBPromise =require('bluebird');

function createModule($job,$logger)
{
  $job.registerJobType(startJob,'multi');

  function startJob(settings,callbackProgress,callbackCancelCalled,callbackPend,callbackAbort)
  {
    if(!settings.subJobs || !Array.isArray(settings.subJobs) )
    {
      $logger.error('multi job settings.subJobs is not an array');
      throw new Error('multi job settings.subJobs is not an array');
    }
    return BBPromise.each(settings.subJobs,function(subJob,index,length){
        if(callbackCancelCalled())
        {
          throw new Error('NDJS_ABORT');
        }
        var thisJobProgressCallback=function(subProgress)
        {
          callbackProgress(index * 1.0/length +subProgress/length);
        };
        thisJobProgressCallback(0);
        return $job.startJob(subJob.type,subJob.settings,thisJobProgressCallback,callbackCancelCalled,callbackPend,callbackAbort);
    });
  }
}
