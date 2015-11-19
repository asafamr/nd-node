'use strict';


var mod={};
module.exports=mod;
mod.getName=function(){return '$pages';};
mod.createModule=createModule;
mod.$inject=['$uiActions','$config'];

function createModule($uiActions,$config)
{
  var pagesModule={};
  pagesModule.getPages=getPages;
	registerUiActions();
	return pagesModule;

	function registerUiActions()
	{
    $uiActions.registerAction('getPages',[],getPages);
	}



  function getPages()
  {
    var pages=$config.getConfig('pages');
    if(pages===undefined)
    {
      throw new Error('no pages found');
    }
    return pages;//_.pluck(pages,'name');
  }


}
