'use strict';
var core=require('../../../../duck-core');
var BPromise=require('bluebird');
var logger=core.dRequire('logger');
var jobManager=core.dRequire('job-manager');
var childProcess  = require('child_process');
var estimateMbPerSec=5;
var timeoutIntervalMs=500;
jobManager.registerJobType('extract',startExtract,estimateExtract);

function extractFromTo(from,to,job,onEnd)
{
	logger.debug('Starting extraction from '+ from+' to '+to+' '+JSON.stringify(job));
	var args=['--block2','--block2Target',to];
	if(from!=='')
	{
		args.push('--block2Path');
		args.push(from);
	}
	//console.log(process.env.DUCK_EXE +args.join(' '));
	if(!process.env.hasOwnProperty('DUCK_EXE') || process.env.DUCK_EXE==='')
	{
		throw new Error('Extractor path not defined');
	}
    console.log(args);
	var extractProcess=childProcess.spawn(process.env.DUCK_EXE,args); 

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
				job.mbCurrentExtracted=parseFloat(byteNums[0])/(1024*1024);
				//logger.debug('progress is '+parseInt(currentProgress*100) +'%');
			}
			else if(line.lastIndexOf('Written file ', 0) === 0)
			{
				//logger.debug('Written file '+line.substr('Written file '.length));
			}
			else if(line.lastIndexOf('Total size:', 0) === 0)
			{
				logger.debug('Total size '+parseInt(line.substr('Total size: '.length)));
			}
		}

		//console.log('stdout: ' + data);
	});
	extractProcess.stderr.on('data', function(data) {
		logger.error('stderr: ' + data);
	});
	extractProcess.on('close', function(code) {
		void code;
		logger.debug('Finished extraction to '+to);
		onEnd();
		//currentProgress=1;
		//console.log('closing code: ' + code);
	});
}
function ExtractJob(jobConfig,onEnd)
{
	var thisJob=this;
	thisJob.mbCurrentExtracted=0;
	var currentSubJobIdx=0;
	var finished=false;
	var lastUpdateRateTime=0;
	var lastUpdateRateMb=0;
	thisJob.getProgress=getCurrentProgress;
	setTimeout(updateRate,timeoutIntervalMs);
	//this is just a way to extract all fromTos one by one
	BPromise.reduce(jobConfig.settings.files,function(myIdx,fromTo){
		currentSubJobIdx=myIdx;
		return new BPromise(function(resolve, reject) {
			extractFromTo(fromTo.from,fromTo.to,thisJob,
										function(){resolve(myIdx+1);});
		}
											 );},0)
		.then(function(){
		finished=true;
		logger.debug('finished extract job:'+JSON.stringify(jobConfig));
		onEnd();
	});

	function getMbExtractedSoFar()
	{
		//logger.debug('--77'+currentSubJobIdx);
		//logger.debug('--'+getSizeUntilIdx(jobConfig,currentSubJobIdx));
		//logger.debug('--*'+thisJob.mbCurrentExtracted);
		return getSizeUntilIdx(jobConfig,currentSubJobIdx)+thisJob.mbCurrentExtracted;
	}
	function updateRate()
	{
		if(finished)
		{
			return;
		}
		var nowTime=Date.now();
		var deltaTimeMs=nowTime-lastUpdateRateTime;
		lastUpdateRateTime=nowTime;
		var mbNow=getMbExtractedSoFar();
		var deltaMb=mbNow-lastUpdateRateMb;
		lastUpdateRateMb=mbNow;

		if(deltaTimeMs<5 || deltaTimeMs>5000 )
		{
			setTimeout(updateRate,timeoutIntervalMs);
			return;
		}
		estimateMbPerSec=estimateMbPerSec*0.7+0.3*1000*deltaMb/deltaTimeMs;
		setTimeout(updateRate,timeoutIntervalMs);
	}

	function getCurrentProgress()
	{
		//logger.debug('--getCurrentProgress ');
		var totalSize= getTotalSize(jobConfig);
		var extractedSoFar=getMbExtractedSoFar();
		//logger.debug('--getCurrentProgress extracted '+extractedSoFar +' '+extractedSoFar/totalSize);
		if(totalSize===0)
		{
			return 1;
		}
		return extractedSoFar/totalSize;
	}

	/*var leftFromTos=fromTos;
	function processFirst()
	{
		if(leftFromTos.length===0)
		{
			onEnd();
		}
		else
		{
			var nextFromTo=leftFromTos.shift();
			extractFromTo(nextFromTo.from,nextFromTo.to,processFirst);
		}
	}
	processFirst();*/

	//onEnd();
}
function startExtract(job,onEnd)
{
	logger.debug('new extract job:'+JSON.stringify(job));
	return new ExtractJob(job,onEnd);
}
function getSizeUntilIdx(job,idx)
{
	//logger.debug('--00getting size '+JSON.stringify({job:job,idx:idx}));
	var totalSize=0;
	if(job.hasOwnProperty('settings') && job.settings.hasOwnProperty('files'))
	{
		for(var i =0;i<job.settings.files.length;i++)
		{
			if(i===idx)
			{
				break;
			}
			if(job.settings.files[i].hasOwnProperty('size'))
			{
				totalSize+=job.settings.files[i].size;
			}
	
		}
	}
	//logger.debug('--totalsize'+totalSize);
	return totalSize;
}
function getTotalSize(job)
{
	return getSizeUntilIdx(job,-1);
}
function estimateExtract(job)
{	
	//logger.debug('estimating extract'+JSON.stringify(job));
	if(estimateMbPerSec===0)return 1000000;
	return getTotalSize(job)/estimateMbPerSec;
}