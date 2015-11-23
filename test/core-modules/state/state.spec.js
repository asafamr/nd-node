'use strict';

var BBPromise= require('bluebird');

var chai= require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

var stateModule= require(__dirname+'/../../../src/core-modules/state/state');



describe('state module', function(){
		it('name should be $notifications', function(){
      expect(stateModule.moduleName).to.equal('$state');
    });

		it('should get and set nested properties with defualt values', function(){
			var mockUiActions={registerAction:function(){}};

			return BBPromise.resolve(stateModule(mockUiActions)).then(
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
