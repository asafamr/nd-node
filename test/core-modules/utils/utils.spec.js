'use strict';

var BBPromise= require('bluebird');
var path= require('path');
var _= require('lodash');

var chai= require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

var utilsModule= require(__dirname+'/../../../src/core-modules/utils/utils');
var testXmlPath=path.normalize(__dirname+'/test.xml');


describe('utils module', function(){
		it('name should be $utils', function(){
      expect(utilsModule.moduleName).to.equal('$utils');
    });

		it('xml set props', function(){// a bit slow for and disk bound for a unit test
			var rand1='rand'+_.random(0, 10000);
			var rand2='rand'+_.random(0, 10000);
			return BBPromise.resolve(utilsModule()).then(
				function(instance)
				{
					return instance.setXmlFileProps(testXmlPath,{
						'/somexml//change-my-prop/@prop':rand1,
						'//change-my-inner-text/text()':rand2
				}).then(
					function()
					{
						var newContent=instance.getFileContentSync(testXmlPath);
						expect(newContent.match(/prop=['"](.+)['"]/)[1]).to.equal(rand1);
						expect(newContent.match(/<change-my-inner-text>\s*(rand[0-9]+)\s*</)[1]).to.equal(rand2);

					}
				);
				}
			);

		});
		/*
		it('run shell cmd', function(){

			return BBPromise.resolve(utilsModule()).then(
				function(instance)
				{
					return instance.runShellCmd('C:\\temp\\bin\\startup.bat',[],'C:\\temp\\bin\\').then(
					function()
					{


					}
				);
				}
			);

		});*/

});
