'use strict';

//var BBPromise= require('bluebird');
//var path= require('path');

var chai= require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

var moduleReq= require(__dirname+'/../../../src/core-modules/config/config');



describe('config module', function(){
		it('name should be $config', function(){
      expect(moduleReq.moduleName).to.equal('$config');
    });


});
