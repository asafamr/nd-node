'use strict';
createModule.moduleName='mock2';
createModule.$inject=[];
module.exports=createModule;
createModule.func=function(){};//overrriden in tests
function createModule(){createModule.args=arguments;createModule.func();return {};}
