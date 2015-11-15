'use strict';
var BBPromise=require('bluebird');
var childProcess=require('child_process');
var ncp =require('ncp').ncp;

var jobType={};
module.exports=jobType;
jobType.getName=function(){return 'sfx';};
jobType.create=create;

function create(settings,logger)
{
  var jobPromise=BBPromise.reject();
  var jobInstance={};
  var totalExtracted=0;
  var totalSizeMb=0;
  jobInstance.cancel=cancel;
  jobInstance.getProgress=getProgress;
  jobInstance.getPromise=function(){return jobPromise;};
  startPromise();
  return jobInstance;


  function startPromise()
  {
    jobPromise=new BBPromise(function(resolve,reject){
      if(!process.env.hasOwnProperty('ND_SFX_EXE') || process.env.ND_SFX_EXE==='')
    	{
    		extractMockCopy(resolve,reject);
    	}
      else {
        extractSfx(resolve,reject);
      }

    });
  }
  function cancel()
  {

  }
  function extractSfx(resolve,reject)
  {
    sfxFromTo(settings.from,settings.to,resolve,reject);
  }
  function extractMockCopy(resolve,reject)
  {
      ncp.ncp(settings.from,settings.to,{transform:transformFunc},function(err,ok)
    {
      if(err)
      {
        reject(err);
      }
      resolve(ok);
    });
    function transformFunc(read, write,fileName)
    {
      //update progress
      read.pipe(write);
    }

  }
  function getProgress()
  {
    if(totalSizeMb===0)
    {
      return 0;
    }
    return Math.min(Math.max(totalExtracted/totalSizeMb,0),1);
  }
  function sfxFromTo(from,to,resolve,reject)
  {

  	var args=['--block2','--block2Target',to];
  	if(from!=='')
  	{
  		args.push('--block2Path');
  		args.push(from);
  	}
  	//console.log(process.env.ND_SFX_EXE +args.join(' '));
  	if(!process.env.hasOwnProperty('ND_SFX_EXE') || process.env.ND_SFX_EXE==='')
  	{
  		reject('Extractor path not defined');
  	}
      console.log(args);
  	var extractProcess=childProcess.spawn(process.env.ND_SFX_EXE,args);

  	var leftToParse='';

  	extractProcess.stdout.on('data', function(data) {
  		leftToParse+=data;
  		var lines=leftToParse.split(/\r?\n/);
  		if(data[data.length-1]!=='\n')
  		{
  			leftToParse=lines.pop();
  		}
  		else
  		{
  			leftToParse='';
  		}
  		for(var i=0;i<lines.length;i++)
  		{
  			var line=lines[i];
  			if(line.lastIndexOf('Progress ', 0) === 0)
  			{
  				//message look like Progress 12343/123144 (bytes written/total bytes)
  				var byteNums=line.substr('Progress '.length).split(/\//);
  				totalExtracted=parseFloat(byteNums[0])/(1024*1024);
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

  		//console.log('stdout: ' + data);
  	});

    extractProcess.on('close',function(code){
      resolve(code);
    });

  }
}
