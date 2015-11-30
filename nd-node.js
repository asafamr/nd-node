(function(){
'use strict';

var backendInstance = require('./src/backend-instance');



var ndNode =  {};
module.exports=ndNode;
ndNode.create=create;



function create(ndConfigPath)
{
		return backendInstance.create(ndConfigPath);
}


})();
