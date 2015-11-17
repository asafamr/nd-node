'use strict';


var chai= require('chai');
var expect = chai.expect;
var path= require('path');

var moduleLoader= require('../src/module-loader');


var mockDir=path.normalize(__dirname +'/back-instance-mocks');
var modulesPath=[
  path.normalize(mockDir+'/mock-module1.js'),
  path.normalize(mockDir+'/mock-module2.js'),
  path.normalize(mockDir+'/mock-module3.js')
];
function clearCache()
{
  delete require.cache[modulesPath[0]];
  delete require.cache[modulesPath[1]];
  delete require.cache[modulesPath[2]];
}

describe('moduleLoader', function(){

	describe('modules load by path', function(){

    beforeEach(clearCache);

		it('should be able to load from path', function(){
      var mocks=[];
      mocks.push(moduleLoader.getLoader(modulesPath[0]));
      mocks.push(moduleLoader.getLoader(modulesPath[1]));
      mocks.push(moduleLoader.getLoader(modulesPath[2]));

      for(var i=0;i<mocks.length;i++)
      {
        expect(mocks[i]).to.have.ownProperty('name');
        expect(mocks[i]).to.have.ownProperty('factory');
        expect(mocks[i]).to.have.ownProperty('dependencies');
      }

      });


    it('should be able to load from object', function(){
      var n=0;
      var mock=moduleLoader.getLoader({
        createModule:function(){n++;},
        getName:function(){return 'a';}}
      );
      expect(mock.name).to.equal('a');
      expect(mock).to.have.ownProperty('factory');
      mock.factory();
      expect(n).to.equal(1);
      expect(mock.dependencies).to.deep.equal([]);
    });

    it('should be able to load a singleton', function(){
      var n=0;
      var mock=moduleLoader.getLoader({
        instance:function(){n++;},
        getName:function(){return 'b';}}
      );
      expect(mock.name).to.equal('b');
      expect(mock).to.have.ownProperty('factory');
      mock.factory()();
      expect(n).to.equal(1);
      expect(mock.dependencies).to.deep.equal([]);
    });




	});



});
