
'use strict';
var logger={};//require('winston');
logger.level = 'debug';
logger.debug=logger.error=logger.info=logger.warn=function(msg){console.log(msg);};
module.exports=logger;
