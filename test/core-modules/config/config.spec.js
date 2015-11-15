'use strict';

var BBPromise= require('bluebird');
var path= require('path');

var chai= require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

var uiActions= require(__dirname+'/../../../src/core-modules/config/config');



describe('config module', function(){
		it('name should be $config', function(){
      expect(uiActions.getName()).to.equal('$config');
    });

		it('should get all pages, one page by name and register action', function(){// break to several tests
			var actionRegistered=false;
			var mockBackend={getConfigPath:function(){return path.normalize(__dirname+'../../../mock-ndfile.js');}};
			var mockUIActions={registerAction:function(){actionRegistered=true;}};

			return BBPromise.resolve(uiActions.createModule(mockBackend,mockUIActions)).then(
				function(instance)
				{
					expect(actionRegistered).to.equal(true);
					expect(instance.getPageNames()).to.deep.equal(['welcome','eula','dir','extract','conclusion']);
					expect(instance.getPage('dir')).to.deep.equal({'name':'dir','type':'directory','settings':{'dir':'installDir'}});
				}
			);

		});

});
