/**
@name copy corejob
@description copy files/directories job
@param subjobs {Array}
@example {'type':'copy','settings':{'files':[ {'from':'<%=user.config.installDir%>/tomcat','to':'<%=user.config.installDir%>/tomcat2','size':109}]}}
**/
'use strict';

var BBPromise =require('bluebird');
var fs=require('fs-extra');
var ourNcp=require(__dirname+'/lib/ndjs_ncp');
var path=require('path');
var _=require('lodash');
var copyPromisified=BBPromise.promisify(ourNcp);

module.exports=createModule;
createModule.moduleName='$job_copy';
createModule.$inject=['$job','$logger'];

function createModule($job,$logger)
{
  $job.registerJobType(startJob,'copy');

  function startJob(settings,callbackProgress,callbackCancelCalled,callbackPend,callbackAbort)
  {
    var totalSize=_.sum(settings.files,'size');
    var extractedSoFar=0;
    var baseOutgiong=process.cwd();
    return  BBPromise.each(settings.files,function(fromTo)
    {
      var aborted=false;
      var pathFrom=path.resolve(baseOutgiong,fromTo.from);
      var ncpPendingCallback=function(params)
      {
        var message=''+params.error;
        var detail='';
        if(params.error.code)
        {
          message=params.error.code;
        }
        if(params.error.path)
        {
          detail=params.error.path;
        }
        callbackPend(message,detail,{
          retry:params.retry,
          ignore:params.ignore,
          abort:function(){
            if(!aborted){callbackAbort();}
            aborted=true;
          params.abort();}
        });
      };
      return copyPromisified(pathFrom,fromTo.to,{transform:transformFunc,pendingCallback:ncpPendingCallback}).catch(
        function(err)
        {
          if(aborted)
          {
            return BBPromise.reject('ABORTED');
          }
          else
          {
            throw err;
          }
        }
      );
    });

    function transformFunc(read, write,fileName)
    {
      fs.stat(fileName.name,function(err,stats)
      {
        if(err)
        {
          $logger.debug(err);
        }
        else {
          if(totalSize!==0)
          {
            extractedSoFar+=parseFloat(stats.size)/(1024*1024);
            var prog =Math.max(0,Math.min(1,extractedSoFar/totalSize));
            callbackProgress(prog);
          }
        }
      });
      read.pipe(write);
    }

  }

}
