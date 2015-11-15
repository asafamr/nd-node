'use strict';

var BBPromise= require('bluebird');

var chai= require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

var uiActions= require(__dirname+'/../../../src/core-modules/state/state');



describe('state module', function(){
		it('name should be $notifications', function(){
      expect(uiActions.getName()).to.equal('$state');
    });

		it('should get and set nested properties with defualt values', function(){
			var mockBackend={};

			return BBPromise.resolve(uiActions.createModule(mockBackend)).then(
				function(instance)
				{
					expect(instance.getSettings('user.abc.def','default val')).to.equal('default val');
					instance.setSettings('user.abc.def','new val');
					expect(instance.getSettings('user.abc.def','default val')).to.equal('new val');
					expect(instance.getSettings('user',undefined)).to.deep.equal({abc:{def:'new val'}});
				}
			);

		});

});
