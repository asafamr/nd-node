'use strict';
var BBPromise=require('bluebird');
var childProcess=require('child_process');
var fs=require('fs-extra');
var path=require('path');


module.exports=create;
create.jobType='extract';

function create(settings,logger,$backend)
{
  var configModule=$backend.getModule('$config');
  var baseOutgiong=configModule.getOutgoingDir();
  var extractedSoFar=0;
  var needsToBeExtracted=settings.size || 1;
  var jobPromise=getNewPromise();
  jobPromise.shouldCancel=cancel;
  jobPromise.getProgress=getProgress;
  return jobPromise;


  function getNewPromise()
  {
    return new BBPromise(function(resolve){
      if(!process.env.hasOwnProperty('ND_SFX_EXE') || process.env.ND_SFX_EXE==='')
      {
        resolve(extractMockCopy());
      }
      else {
        resolve(selfExtract());
      }

    }).catch(function(err)
    {
      var knownError=null;
      var clientMessage='';
      if(Array.isArray(err))
      {
        err.forEach(function(e)
        {
          if(e.code && e.code==='EBUSY')
          {
            knownError='EBUSY';
            clientMessage='file '+e.path+' is locked';
            logger.error(clientMessage);
          }
          else if(e.code && e.code==='EPERM' && !knownError)
          {
            knownError='EPERM';
            clientMessage='insufficient permission to '+e.path;
            logger.error(clientMessage);
          }
        });
      }
      if(knownError)
      {
        var ndjserr= new Error(knownError);
        ndjserr.ndjsRetry=true;
        ndjserr.clientMessage=clientMessage;
        throw ndjserr;
      }
      else {
        throw new Error(err);
      }
    });

  }
  function getProgress()
  {
    return Math.max(0,Math.min(1,extractedSoFar/needsToBeExtracted));
  }
  function cancel()
  {

  }

  function extractMockCopy()
  {
    var copyPromise=BBPromise.promisify(fs.copy);
    return BBPromise.each(settings.files,function(fromTo)
    {
      var pathFrom=path.resolve(baseOutgiong,fromTo.from);
      return copyPromise(pathFrom,fromTo.to,{transform:transformFunc});
    });

    function transformFunc(read, write,fileName)
    {
      fs.stat(fileName.name,function(err,stats)
      {
        if(err)
        {
          logger.debug(err);
        }
        else {
          extractedSoFar+=parseFloat(stats.size)/(1024*1024);
        }

      });
      read.pipe(write);
    }

  }

  function selfExtract()
  {
    if(!process.env.hasOwnProperty('ND_SFX_EXE') || process.env.ND_SFX_EXE==='')
    {
      return BBPromise.reject('Extractor path not defined');
    }
    var extractedBeforeThisJob=0;
    return BBPromise.each(settings.files,function(fromTo)
    {
      return new BBPromise(function(resolve){
          var extractedByThisJob=0;
          var pathFrom=fromTo.from;
          var pathTo=fromTo.to;
          var args=['--block2','--block2Target',pathTo];
          args.push('--block2Path');
          args.push(pathFrom);

          logger.debug('extracting '+pathFrom +' to '+pathTo);

          var processOutputBuffer='';
          var extractProcess=childProcess.spawn(process.env.ND_SFX_EXE,args);

          extractProcess.stdout.on('data', function(data) {
            processOutputBuffer+=data;
            var lines=processOutputBuffer.split(/\r?\n/);
            if(data[data.length-1] !== '\n')
            {
              //if the final line has not finished printing save it for later parseing
              processOutputBuffer=lines.pop();
            }
            else
            {
              processOutputBuffer='';
            }
            var reportedExtractedByThisJob=processSfxOutputLogLines(lines);
            if(reportedExtractedByThisJob)
            {
              extractedByThisJob=reportedExtractedByThisJob;
              extractedSoFar=extractedBeforeThisJob+extractedByThisJob;
            }
          });
          extractProcess.on('close',function(code){
            extractedBeforeThisJob+=extractedByThisJob;
            extractedSoFar=extractedBeforeThisJob;
            resolve(code);
          });

      });

    });
    function processSfxOutputLogLines(lines)
    {
      var thisJobExtracted;
      for(var i=0;i<lines.length;i++)
      {
        var line=lines[i];
        if(line.lastIndexOf('Progress ', 0) === 0)
        {
          //message look like Progress 12343/123144 (bytes written/total bytes)
          var byteNums=line.substr('Progress '.length).split(/\//);
          thisJobExtracted=parseFloat(byteNums[0])/(1024*1024);
          //logger.debug('progress is '+parseInt(currentProgress*100) +'%');
        }
        else if(line.lastIndexOf('Written file ', 0) === 0)
        {
          //logger.debug('Written file '+line.substr('Written file '.length));
        }
        else if(line.lastIndexOf('Total size:', 0) === 0)
        {
          logger.debug('Total size '+parseInt(line.substr('Total size: '.length),10));
        }
      }
      return thisJobExtracted;
    }



  }
}
