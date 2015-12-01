
module.exports = function(grunt) {
'use strict';
  // Add the grunt-mocha-test tasks.
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.initConfig({
    // Configure a mochaTest task
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          captureFile: 'results.txt', // Optionally capture the reporter output to a file
          quiet: false, // Optionally suppress output to standard out (defaults to false)
          clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false)
        },
        src: ['test/**/*spec.js']
      }
    },
    nddox:
    {
      files: {
        src: ['src/**/*.js'],
        dest: 'docs/docs.html'
      }
    }
  });

  grunt.registerMultiTask('nddox','create docs using dox',function()
  {
    //todo:clean and move to some common place - used by nd-node as well
    grunt.log.debug('Doxing...');
    var dox = require('dox');
    var _ =require('lodash');
    var doc = function (file) {
      var buf = grunt.file.read(file),
      obj = dox.parseComments(buf, {
        raw: true
      });
      return obj;
    };

    // Iterate over all specified file groups.
    this.files.forEach(function(file) {
      // Concat specified files.
      var objss = file.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(doc);

      var filtered={modules:[],directives:[],services:[],corejobs:[]};

      var lastObjWithMethods={};
      var objs=_.flatten(objss, true);
          objs.forEach(function(obj)
          {
            if(obj && obj.tags)
            {
              var indexedByTag= _.indexBy(obj.tags,'type');
              var getFiltered=function()
              {
                var ret={};
                var doxName=indexedByTag.name && indexedByTag.name.string.replace(/ directive| service| module| corejob/g,'');
                doxName=doxName|| obj && obj.ctx && obj.ctx.name;
                if(doxName){ret.name=doxName;}
                var doxDesc=indexedByTag.description && indexedByTag.description.string ||'';
                if(doxDesc){ret.description=doxDesc;}
                var doxExample=indexedByTag.example && indexedByTag.example.string ||'';
                if(doxExample){ret.example=doxExample;}
                var doxRet=indexedByTag.return && indexedByTag.return.string ;
                if(doxRet){ret.return=doxRet;}
                var doxParams=_.map(_.filter(obj.tags,{type:'param'}),function(param)
                {
                  return {
                    name:param.name,
                    description: param.description,
                    type : param.types.join(',')
                  };
                });
                if(doxParams.length>0){ret.params=doxParams;}
                return ret;
              };

              if(indexedByTag && indexedByTag.name && / module/.test(indexedByTag.name.string))
              {
                var mod=getFiltered();
                lastObjWithMethods=mod;
                filtered.modules.push(mod);
              }
              if(indexedByTag && indexedByTag.name && / corejob/.test(indexedByTag.name.string))
              {
                var corejob=getFiltered();
                lastObjWithMethods=corejob;
                filtered.corejobs.push(corejob);
              }

              if(indexedByTag && indexedByTag.name && / directive/.test(indexedByTag.name.string))
              {
                var dir=getFiltered();
                lastObjWithMethods=dir;
                filtered.directives.push(dir);

              }

              if(indexedByTag && indexedByTag.name && / service/.test(indexedByTag.name.string))
              {
                var serv=getFiltered();
                lastObjWithMethods=serv;
                filtered.services.push(serv);
              }

              if(_.get(obj,'ctx.type')==='function')
              {
                if(!lastObjWithMethods.methods){lastObjWithMethods.methods=[];}
                lastObjWithMethods.methods.push(getFiltered());
              }



            }
      });
      var html='';

      var getDivStr=function(value,divPrefix)
      {
        if(!value){return '';}
        return '<div class="dox-'+divPrefix+'">'+_.escape(value)+'</div>';
      };

      function getArrayTemplateAsString(arr,prefix)
      {
        if(!arr){return '';}

        return '<div class="dox-'+prefix+'s">'+_.map(arr,function(oneObj)
      {
        var ret='<div class="dox-'+prefix+'">';
        ret+=getDivStr(oneObj.name,'name');
        ret+=getDivStr(oneObj.type,'type');
        ret+=getDivStr(oneObj.description,'description');
        ret+=getArrayTemplateAsString(oneObj.params,'param');
        ret+=getDivStr(oneObj.return,'return');
        ret+=getArrayTemplateAsString(oneObj.methods,'method');
        ret+=getDivStr(oneObj.example,'example');
        ret+='</div>';

        return ret;

      }).join('\n')+'</div>';
      }

      html+=getArrayTemplateAsString(filtered.modules,'module');

      html+=getArrayTemplateAsString(filtered.services,'service');
      html+=getArrayTemplateAsString(filtered.directives,'directive');
      html+=getArrayTemplateAsString(filtered.corejobs,'corejob');

      html+='</div>\n';
      var prettyPrint = require('html').prettyPrint;
      grunt.file.write(file.dest, prettyPrint(html, {indent_size: 4}));


    });


  });



  grunt.registerTask('default', 'mochaTest');

};
