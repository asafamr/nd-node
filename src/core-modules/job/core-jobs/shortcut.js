'use strict';
var ws = require('windows-shortcuts');

var jobType={};
module.exports=jobType;
jobType.getName=function(){return 'shortcut';};
jobType.create=create;

function create(settings,logger)
{
  ws.create(settings.dest, {
    target : settings.src
}, function(err) {
    if (err)
    {
        throw new Error(err);
    }
    else
    {
        logger.debug('Shortcut created!');
    }
});
}
