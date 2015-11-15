module.exports=function(ndjs)
{
  'use strict';
  ndjs.initConfig(
{
'options':
{
  'frontend':'front',
  'backend':'back',
  'outgoing':'outgoing'

},
'install':
{
  'pages':
  [
    {'name':'welcome','type':'custom'},
    {'name':'eula','type':'eula'},
    {'name':'dir','type':'directory','settings':{'dir':'installDir'}},
    {'name':'extract','type':'extract','settings':{'job':'main'}},
    {'name':'conclusion','type':'custom'}
  ],
  'jobs':
  [
    {'name':'main','type':'multi','settings':[
      {'type':'extract',
       'settings':{'files':
         [{'from':'','to':'','size':100}]}}
    ]}
  ]
},
'uninstall':
{
  'pages':
  [
    {'name':'confirm','type':'custom'},
    {'name':'remove','type':'progress','settings':{'job':'remove'}},
    {'name':'conclusion','type':'custom'}
  ],
  'jobs':
  [
    {'name':'remove','settings':[{'type':'delete',settings:{dir:''}}]}

    ]

}
});
};
