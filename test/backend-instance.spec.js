'use strict';


var chai= require('chai');
var expect = chai.expect;
var path= require('path');

var backendInstance= require('../src/backend-instance');


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

describe('backend instance', function(){

	describe('modules load dependencies', function(){


		it('load according to order', function(){
      clearCache();
      var loadOrder=[];
      var mock1=require(modulesPath[0]);
      var mock2=require(modulesPath[1]);
      var mock3=require(modulesPath[2]);
      mock1.createModule=function(){loadOrder.push(1);};
      mock2.createModule=function(){loadOrder.push(2);};
      mock3.createModule=function(){loadOrder.push(3);};
      mock2.$inject=[mock1.getName()];
      mock1.$inject=[mock3.getName()];

      var inst=backendInstance.create(path.normalize(__dirname+'/mock-ndfile.js'));
      inst.registerModule(mockDir+'/mock-module1');
      inst.registerModule(mockDir+'/mock-module2');
      inst.registerModule(mockDir+'/mock-module3');
      return inst.startLoad().then(function(){

        expect(loadOrder).to.deep.equal([3,1,2]);

      });


		});

    it('should get dependencies', function(){
      clearCache();
      var mock1=require(modulesPath[0]);
      var mock2=require(modulesPath[1]);
      var mock3=require(modulesPath[2]);


      var somespecialobject1={'im':'special1'};
      var somespecialobject2={'im':'special2'};
      var somespecialobject3={'im':'special3'};

      var a1;
      var a2;
      var a3;
      mock1.createModule=function(a,b,c){
        a1=a;
        a2=b;
        a3=c;
        return somespecialobject1;};
      mock2.createModule=function(){return somespecialobject2;};
      mock3.createModule=function(){return somespecialobject3;};
      mock1.$inject=[mock2.getName(),mock3.getName()];

      var inst=backendInstance.create(path.normalize(__dirname+'/mock-ndfile.js'));
      inst.registerModule(modulesPath[0]);
      inst.registerModule(modulesPath[1]);
      inst.registerModule(modulesPath[2]);
      return inst.startLoad().then(function(){

        expect(a1).to.be.equal(inst);
        expect(a2).to.be.equal(somespecialobject2);
        expect(a3).to.be.equal(somespecialobject3);
      });
    });



    it('should fail on cyclic depend', function(){
      clearCache();
      var mock1=require(modulesPath[0]);
      var mock2=require(modulesPath[1]);
      var mock3=require(modulesPath[2]);



      mock1.createModule=function(){return 1;};
      mock2.createModule=function(){return 2;};
      mock3.createModule=function(){return 3;};
      mock1.$inject=[mock2.getName()];
      mock2.$inject=[mock3.getName()];
      mock3.$inject=[mock1.getName()];

      var inst=backendInstance.create(path.normalize(__dirname+'/mock-ndfile.js'));
      inst.registerModule(modulesPath[0]);
      inst.registerModule(modulesPath[1]);
      inst.registerModule(modulesPath[2]);
      expect(inst.startLoad).to.throw(Error);//jshint ignore:line

    });
	});



});
