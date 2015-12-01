/**
@name pages module
@description pages handling
**/
'use strict';


module.exports=createModule;
createModule.moduleName='$pages';
createModule.$inject=['$uiActions','$config'];

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


  /**
	* @name getPages
	* @return all pages an their current data for current installation stage
	**/
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
