'use strict';


var chai= require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

var uiActions= require(__dirname+'/../../../src/core-modules/ui-actions/ui-actions');



describe('ui actions module', function(){
		it('name should be $uiActions', function(){
      expect(uiActions.getName()).to.equal('$uiActions');
    });

		it('actions number of arguments', function(){
			var mockBackend={};
			var instance=uiActions.createModule(mockBackend);
			instance.registerAction('someAction',['arg1'],function(){});
			return expect(instance.runAction('someAction',[])).to.eventually.be.rejected;
		});
		it('actions run with arguments and return promise', function(){
			var mockBackend={};
			var run=false;
			var instance=uiActions.createModule(mockBackend);
			var aAction=function(anArg,anotherArg)
			{
				if(anArg==='passedValue' && anotherArg==='passedValue2')
				{
					run='alright';
				}
			};
			instance.registerAction('someAction',['arg1','arg2'],aAction);
			return expect(instance.runAction('someAction',['passedValue','passedValue2']).then(
				function(){return run;}
			)).to.eventually.equal('alright');

		});

});
