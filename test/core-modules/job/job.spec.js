'use strict';

var BBPromise= require('bluebird');
var path= require('path');

var chai= require('chai');
var fs= require('fs-extra');
//var chaiAsPromised = require('chai-as-promised');
//chai.use(chaiAsPromised);
var expect = chai.expect;

//var uiActions= require(__dirname+'/../../../src/core-modules/job/job');
var backendInstance= require('../../../src/backend-instance');


var $job;
var $notifications;
var tempPath=path.normalize(__dirname+'../../../../.tmp');
function initMock(done)
{
  var backInst=backendInstance.create(path.normalize(__dirname+'/copymock-ndfile.js'));
  backInst.startLoad().then(function(){
    $job=backInst.getModule('$job');
    $notifications=backInst.getModule('$notifications');
    backInst.getModule('$state').setSettings('user.source',tempPath+'/source');
    backInst.getModule('$state').setSettings('user.target',tempPath+'/target');
    done();
  });

}

function deleteTempDirs(done)
{
  console.log('starting deleteTempDirs');
   BBPromise.promisify(fs.emptyDir)(tempPath)
   .then(function(){console.log('finished deleteTempDirs');}).then(done);
}
//create a source dir and target dir with some files in the source so we could run
//the mock self extract job on in(it should copy them to the target)
function createTempDirsWithSources(done)
{
  console.log('starting createTempDirsWithSources');
  BBPromise.promisify(fs.ensureDir)(tempPath).then(
    function()
    {
        return BBPromise.promisify(fs.ensureDir)(path.join(tempPath,'target'));
    }
  ).then(
    function()
    {
        return BBPromise.promisify(fs.ensureDir)(path.join(tempPath,'source','a'));
    }
  ).then(
    function()
    {
        return BBPromise.promisify(fs.ensureDir)(path.join(tempPath,'source','b'));
    }
  ).then(
    function()
    {
        return BBPromise.promisify(fs.writeFile)(path.join(tempPath,'source','a','file1.txt'),'file a1');
    }
  ).then(
    function()
    {
        return BBPromise.promisify(fs.writeFile)(path.join(tempPath,'source','a','file2.txt'),'file a2');
    }
  ).then(
    function()
    {
        return BBPromise.promisify(fs.writeFile)(path.join(tempPath,'source','a','file2.txt'),'file a2');
    }
  ).then(
    function()
    {
        return BBPromise.promisify(fs.writeFile)(path.join(tempPath,'source','b','file1.txt'),'file b1');
    }
  )
  .then(function(){console.log('finished createTempDirsWithSources');}).then(done);

}
describe('job module', function(){
beforeEach(initMock);
    describe('multi job',function()
    {

      it('should be able to manually run', function(){
        var testStr='';
        var emptyFunc=function(){};
        var customJobCreate=function(settings)
        {
          return new BBPromise(function(resolve)
        {
          void resolve;
          testStr+=settings.str;
          resolve('ok');
        });
      };
      customJobCreate.jobType='custom';
        $job.registerJobType(customJobCreate);
        $job.startJob('multi',{'subJobs':[
          {'type':'custom','settings':{'str':'a'}},
          {'type':'custom','settings':{'str':'b'}},
          {'type':'custom','settings':{'str':'c'}}
      ]},emptyFunc,emptyFunc,emptyFunc).then(function()
    {
      expect(testStr).to.equal('abc');
    }).error(function(){expect.fail('multi job did not run correctly');});
      });



    });

    before(deleteTempDirs);
    before(createTempDirsWithSources);
    describe('sfx job',function()
    {

      it('on debug-mock should copy instead', function(){
        var emptyFunc=function(){};
        return $job.startJob('sfx',{'files':[
          {'from':path.join(tempPath,'source','a'),'to':path.join(tempPath,'target','target-a')},
          {'from':path.join(tempPath,'source','b'),'to':path.join(tempPath,'target','target-b')}
        ]},emptyFunc,emptyFunc,emptyFunc).then(function()
        {
          return BBPromise.promisify(fs.readFile)(path.join(tempPath,'target','target-a','file2.txt'),'utf8');
        }).then(function(fileA2)
        {
          expect(fileA2).to.equal('file a2');
        }).then(function()
        {
          return BBPromise.promisify(fs.readFile)(path.join(tempPath,'target','target-b','file1.txt'),'utf8');
        }).then(function(fileA2)
        {
          expect(fileA2).to.equal('file b1');
        });
      });
    });


    before(deleteTempDirs);
    before(createTempDirsWithSources);
    describe('job pending and retrying',function()
    {
      it('should stop copy and wait for answer when no permission', function(){

        var hasStopped=false;
        var hasRetriedFailed=false;
        var hasRetried2=false;

        var pendingId;
        var lockFilePath=path.join(tempPath,'target','target-a','file2.txt');
        fs.ensureFileSync(lockFilePath);
        var openedFile = fs.openSync(lockFilePath,'w');

        return new BBPromise(function (resolve)
        {
            var processNotif=function(notif)
            {
              if(notif.name==='job_pending')
              {
                pendingId=notif.value.pendingId;
                if(hasRetriedFailed)
                {
                  hasRetried2=true;
                }
                else if(hasStopped)
                {
                  hasRetriedFailed=true;
                  fs.closeSync(openedFile);
                  $job.releasePendingJob(pendingId,'retry');
                }
                else
                {
                  hasStopped=true;
                  $job.releasePendingJob(pendingId,'retry');
                }
              }
              else if(notif.name==='job_status')
              {
                if(notif.value.progress===1 && hasRetriedFailed && hasStopped)
                {
                  expect(hasRetriedFailed && hasStopped && !hasRetried2).to.equal(true);
                  resolve('ok');
                }
              }
            };
            $notifications.listenToNotifications(processNotif);
            $job.startNamedJob('main');
        });
      });});


        before(deleteTempDirs);
        before(createTempDirsWithSources);
        describe('job pending and retrying',function()
        {
          it('should stop copy and wait for answer when no permission', function(){

            var hasStopped=false;
            var hasRetriedFailed=false;
            var hasRetried2=false;

            var pendingId;
            var lockFilePath=path.join(tempPath,'target','target-a','file2.txt');
            fs.ensureFileSync(lockFilePath);
            var openedFile = fs.openSync(lockFilePath,'w');

            return new BBPromise(function (resolve)
            {
                var processNotif=function(notif)
                {
                  if(notif.name==='job_pending')
                  {
                    pendingId=notif.value.pendingId;
                    if(hasRetriedFailed)
                    {
                      hasRetried2=true;
                    }
                    else if(hasStopped)
                    {
                      hasRetriedFailed=true;
                      $job.releasePendingJob(pendingId,'ignore');
                    }
                    else
                    {
                      hasStopped=true;
                      $job.releasePendingJob(pendingId,'retry');
                    }
                  }
                  else if(notif.name==='job_status')
                  {
                    if(notif.value.progress===1 && hasRetriedFailed && hasStopped)
                    {
                      expect(hasRetriedFailed && hasStopped && !hasRetried2).to.equal(true);
                      resolve('ok');
                      fs.closeSync(openedFile);
                    }
                  }
                };
                $notifications.listenToNotifications(processNotif);
                $job.startNamedJob('main');
            });
      });
    });

    before(deleteTempDirs);
    before(createTempDirsWithSources);
    describe('job pending and aborting',function()
    {
      it('should stop copy and wait for answer when no permission', function(){

        var hasStopped=false;
        var hasRetriedFailed=false;
        var hasRetried2=false;

        var pendingId;
        var lockFilePath=path.join(tempPath,'target','target-a','file2.txt');
        fs.ensureFileSync(lockFilePath);
        var openedFile = fs.openSync(lockFilePath,'w');

        return new BBPromise(function (resolve)
        {
            var processNotif=function(notif)
            {
              if(notif.name==='job_pending')
              {
                pendingId=notif.value.pendingId;
                if(hasRetriedFailed)
                {
                  hasRetried2=true;
                }
                else if(hasStopped)
                {
                  hasRetriedFailed=true;
                  $job.releasePendingJob(pendingId,'abort');
                }
                else
                {
                  hasStopped=true;
                  $job.releasePendingJob(pendingId,'retry');
                }
              }
              else if(notif.name==='job_aborted')
              {
                if(hasRetriedFailed && hasStopped)
                {
                  expect(hasRetriedFailed && hasStopped && !hasRetried2).to.equal(true);
                  resolve('ok');
                  fs.closeSync(openedFile);
                }
              }
            };
            $notifications.listenToNotifications(processNotif);
            $job.startNamedJob('main');
        });
  });
});



});
