'use strict';

var BBPromise= require('bluebird');

var chai= require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

var uiActions= require(__dirname+'/../../../src/core-modules/notifications/notifications');



describe('notifications module', function(){
		it('name should be $notifications', function(){
      expect(uiActions.moduleName).to.equal('$notifications');
    });

		it('should register the get notificationsFromIdx', function(){
			var run=null;//TODO:change to a sinon spy
			var uiactions={registerAction:
				function(name,argNames,callback)
			{
				void callback;
				expect(name).to.equal('notifications_getFromIdx');
				expect(argNames).to.deep.equal(['idx']);
				run='all ok';
			}};
			var promise=BBPromise.resolve(uiActions(uiactions)).then(
				function()
				{
					return run;
				}
			);

			return expect(promise).to.eventually.equal('all ok');
		});

});
