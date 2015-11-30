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
function initMock(done)
{
  var backInst=backendInstance.create(path.normalize(__dirname+'../../../mock-ndfile.js'));
  backInst.startLoad().then(function(){
    $job=backInst.getModule('$job');
    done();
  });

}
var tempPath=path.normalize(__dirname+'../../../../.tmp');
function deleteTempDirs(done)
{
  BBPromise.promisify(fs.emptyDir)(tempPath).then(done);
}
//create a source dir and target dir with some files in the source so we could run
//the mock self extract job on in(it should copy them to the target)
function createTempDirsWithSources(done)
{


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
  ).then(done);

}
describe('job module', function(){
beforeEach(initMock);
    describe('multi job',function()
    {

      it('should be able to manually run', function(){
        var testStr='';
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
      ]}).then(function()
    {
      expect(testStr).to.equal('abc');
    }).error(function(){expect.fail('multi job did not run correctly');});
      });



    });
    before(deleteTempDirs);
    before(createTempDirsWithSources);
    after(deleteTempDirs);
    describe('sfx job',function()
    {
      it('on debug-mock should copy instead', function(){

        return $job.startJob('extract',{'files':[
          {'from':path.join(tempPath,'source','a'),'to':path.join(tempPath,'target','target-a')},
          {'from':path.join(tempPath,'source','b'),'to':path.join(tempPath,'target','target-b')}
        ]}).then(function()
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




});
