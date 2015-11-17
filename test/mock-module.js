'use strict';
var mockModule={};
mockModule.getName=function(){return 'mock';};
mockModule.createModule=createModule;
mockModule.$inject=[];
module.exports=mockModule;

function createModule(){mockModule.args=arguments;}
