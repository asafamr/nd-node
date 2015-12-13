/**
@name sfx corejob
@description extract files compressed into the installer file (mocks by copy during debug) thorw retry error when insufficient premmissions
@param files {Array} array of objects with properties: from (source of extract), to (destenation) and optionally size:MB to extract for progress estimation
@example
settings example 	{'type':'extract','settings':{'files':[ {'from':'tomcat','to':'<%=user.config.installDir%>','size':109},
{'from':'jre','to':'<%=user.config.installDir%>/jre','size':93},
{'from':'webapp','to':'<%=user.config.installDir%>/webapps/ROOT','size':0}]}}
**/
'use strict';


var BBPromise =require('bluebird');
var childProcess=require('child_process');
var _=require('lodash');
var path=require('path');

module.exports=createModule;
createModule.moduleName='$job_sfx';
createModule.$inject=['$job','$config','$logger'];

function createModule($job,$config,$logger)
{
  $job.registerJobType(startJob,'sfx');



  function startJob(settings,callbackProgress,callbackCancelCalled,callbackPend,callbackAbort)
  {
    var baseOutgiong=$config.getOutgoingDir();
    if(!process.env.hasOwnProperty('ND_SFX_EXE'))
    {
      //we are running in nd_debug and files need copying from outgoing, not sfx
      var newSettings=_.clone(settings,true);
      newSettings.files=_.map(newSettings.files,function(file)
        {
          var ret= {
            from:path.resolve(baseOutgiong,file.from),
            to:path.resolve(baseOutgiong,file.to)
            };
            if(file.size)
            {
              ret.size=file.size;
            }
            return ret;
        });
      return $job.startJob('copy',newSettings,callbackProgress,callbackCancelCalled,callbackPend,callbackAbort);
    }
    else
    {
      return selfExtract();
    }
    function selfExtract()
    {
      var extractedByPrevious=0;//accumulate all extractions done before current task in MB
      var totalSize=_.sum(settings.files,'size');

      return BBPromise.each(settings.files,function(fromTo)
      {
        return new BBPromise(function(resolve,reject){
          if(callbackCancelCalled())
          {
            callbackAbort();
            reject('NDJS_ABORT');
          }
          var pathFrom=fromTo.from;
          var pathTo=fromTo.to;
          var args=['--block2','--block2Target',pathTo];
          args.push('--block2Path');
          args.push(pathFrom);
          var status={currentFile:'',writeError:false,extractedByThisJob:0};
          $logger.debug('extracting '+pathFrom +' to '+pathTo);

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
            processSfxOutputLogLines(lines,status);
            if(status.writeError)
            {
              callbackPend('EPERM',status.currentFile,{
                retry:function(){extractProcess.stdin.write('r\n');},
                ignore:function(){extractProcess.stdin.write('i\n');},
                abort:function(){callbackAbort();reject();}
            });
          }
          });
          extractProcess.on('close',function(code){
            if(!code){code=-1;}
            extractedByPrevious+=status.extractedByThisJob;
            resolve(code);
          });
        });
      });
      function processSfxOutputLogLines(lines,status)
      {
        for(var i=0;i<lines.length;i++)
        {

          var line=lines[i];
          if(line.lastIndexOf('Progress ', 0) === 0)
          {
            //message look like Progress 12343/123144 (bytes written/total bytes)
            var byteNums=line.substr('Progress '.length).split(/\//);
            if(totalSize>0)
            {
              status.extractedByThisJob=parseFloat(byteNums[0])/(1024*1024);
              var extractedTotal=status.extractedByThisJob+extractedByPrevious;
              var prog =Math.max(0,Math.min(1,extractedTotal/totalSize));
              callbackProgress(prog);
            }
          }
          else if(line.lastIndexOf('Write error', 0) === 0)
          {
            status.writeError=true;
          }
          else if(line.lastIndexOf('Write finish error', 0) === 0)
          {
            $logger.warn('Write finish error:'+line);
          }
          else if(line.lastIndexOf('Write finish fatal error', 0) === 0)
          {
            $logger.error('extractor fatal error:'+line);
          }
          else if(line.lastIndexOf('Writing file', 0) === 0)
          {
            status.currentFile=line.substring(14);
            status.writeError=false;
          }
          else if(line.lastIndexOf('Written file', 0) === 0)
          {
            status.writeError=false;
          }
          else if(line.lastIndexOf('Total size:', 0) === 0)
          {
            $logger.debug('total size '+parseInt(line.substr('Total size: '.length),10));
          }
          $logger.debug('sfx: '+line);
        }
      }
    }
  }
}
