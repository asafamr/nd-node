/* eslint-env node,mocha */
'use strict';

var fs = require('./fs');

//var os = require('os');
//var fse = require('fs-extra');
var chai= require('chai');
var expect = chai.expect;
var path= require('path');

describe('fs module', function(){
	//fs(core);
	var mockReg=[];
	var mockRegFunc=function(funcName,paramNames,func)
	{mockReg.push({funcName:funcName,
								 paramNames:paramNames,
								 func:func});};
	
	describe('fs_getBaseDir', function(){
		it('should register fs_getBaseDir', function(){
			mockReg=[];
			fs.registerUiActions(mockRegFunc);
			expect(mockReg).to.include({funcName:'fs_getBaseDir',paramNames:[],func:fs.getBaseDir});
		});
		it('should return the working directory', function(done){
			fs.getBaseDir(
				function(err,succ)
				{
					/* eslint-disable no-unused-expressions */
					expect(err).to.be.null;
					expect(succ).to.be.equal(process.cwd());
					done();
					/* eslint-enable no-unused-expressions */
				});

		});

	});
	
	describe('fs_getDirTree', function(){
		it('should register fs_getDirTree', function(){
			mockReg=[];
			fs.registerUiActions(mockRegFunc);
			expect(mockReg).to.include({funcName:'fs_getDirTree',paramNames:['dirPath'],func:fs.getDirTree});
		});
		
		
		it('should return the whole directory tree of dir', function(done){
			
			var treeWalk=function(node,lookName)
			{
				if(node.hasOwnProperty(lookName))
				{
					return true;
				}
				for(var prop in node)
					{
						if(treeWalk(node[prop],lookName)===true)
						{
							return true;
						}
					}
				return false;
			};
			
			fs.getDirTree(process.cwd(),
				function(err,succ)
				{
					/* eslint-disable no-unused-expressions */
					expect(err).to.be.null; 
					expect(treeWalk(succ,path.basename(process.cwd()))).to.be.true; 
					done();
					/* eslint-enable no-unused-expressions */
				});

		});

	});
	
});