'use strict';
var BBPromise=require('bluebird');
var childProcess=require('child_process');
var fs=require('fs');
var ncp =require('ncp').ncp;

var jobType={};
module.exports=jobType;
jobType.getName=function(){return 'extract';};
jobType.create=create;

function create(settings,logger)
{
  var jobPromise=startPromise();
  jobPromise.cancel=cancel;

  return jobPromise;


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
    return jobPromise;
  }
  function cancel()
  {

  }
  function extractSfx(resolve,reject)
  {
    sfxFromTo(settings.from,settings.to,resolve,reject);
  }
  function extractMockCopy(resolve)
  {
    var ncpPromise=BBPromise.promisify(ncp.ncp);
    resolve(BBPromise.each(settings.files,function(fromTo)
  {
      return ncpPromise(fromTo.from,fromTo.to,{transform:transformFunc});
  },0));

    function transformFunc(read, write,fileName)
    {
      void fileName;
      var stats=fs.statSync(fileName.name,function(err,stats)
    {
      if(err)
      {
        logger.debug(err);
      }
      else {
      }

    });

      //update progress
      read.pipe(write);
    }

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
