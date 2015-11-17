'use strict';

var BBPromise= require('bluebird');
var path= require('path');

var chai= require('chai');
//var chaiAsPromised = require('chai-as-promised');
//chai.use(chaiAsPromised);
var expect = chai.expect;

//var uiActions= require(__dirname+'/../../../src/core-modules/job/job');
var backendInstance= require('../../../src/backend-instance');


var mockMod;
var $job;
function initMock()
{
  var backInst=backendInstance.create(path.normalize(__dirname+'../../../mock-ndfile.js'));
  var mockModulePath=path.normalize(__dirname+'../../../mock-module');
  mockMod=require(mockModulePath);
  mockMod.$inject=['$job'];
  mockMod.createModule=function(){$job=arguments[0];return {};};
  backInst.registerModule(mockModulePath);
  backInst.startLoad();
}
describe('job module', function(){
    beforeEach(initMock);
    describe('sfx mock',function()
    {
      it('should get all job names', function(){
          console.log($job.getAllJobs());
      });
    });




});
