'use strict';

var path= require('path');

var chai= require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

var backendInstance= require('../../../src/backend-instance');

var $pages;
function initMock(done)
{
  var backInst=backendInstance.create(path.normalize(__dirname+'../../../mock-ndfile.js'));
  backInst.startLoad().then(function(){
    $pages=backInst.getModule('$pages');
  }).then(done);

}
describe('pages module', function(){

    before(initMock);
		it('should get all pages', function(){// break to several tests

      expect($pages.getPages()).to.deep.equal([
        {'name':'welcome','type':'custom'},
        {'name':'eula','type':'eula'},
        {'name':'dir','type':'directory','settings':{'dir':'installDir'}},
        {'name':'extract','type':'extract','settings':{'job':'main'}},
        {'name':'conclusion','type':'custom'}
      ]);



  });

});
