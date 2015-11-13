(function(){
'use strict';

var mod={};
module.exports=mod;
mod.getName=function(){return 'mock1';};
mod.createModule='override me';
mod.$inject=[];
})();
