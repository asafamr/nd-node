// imported from fs-extra - added retry,abort,ignore callback and semicolons
// imported from ncp (this is temporary, will rewrite)

var fs = require('graceful-fs');
var path = require('path');
var utimes = require(path.dirname(require.resolve('fs-extra'))+'../../lib/util/utimes');

function ncp (source, dest, options, callback) {
  'use strict';
  if (!callback) {
    callback = options;
    options = {};
  }
  var aborted=false;

  var basePath = process.cwd();
  var currentPath = path.resolve(basePath, source);
  var targetPath = path.resolve(basePath, dest);

  var filter = options.filter;
  var transform = options.transform;
  var clobber = options.clobber !== false;
  var dereference = options.dereference;
  var preserveTimestamps = options.preserveTimestamps === true;

  var pendingCallback=options.pendingCallback;
  if(!pendingCallback)
  {
    throw new Error('No pendingCallback');
  }
  var errs = null;

  var started = 0;
  var finished = 0;
  var running = 0;
  // this is pretty useless now that we're using graceful-fs
  // consider removing - said by fs-extra
  var limit = 1;//options.limit || 512;

  startCopy(currentPath);

  function startCopy (source) {
    started++;
    if (filter) {
      if (filter instanceof RegExp) {
        if (!filter.test(source)) {
          return doneOne(true);
        }
      } else if (typeof filter === 'function') {
        if (!filter(source)) {
          return doneOne(true);
        }
      }
    }
    return getStats(source);
  }

  function getStats (source) {
    var stat = dereference && fs.stat || fs.lstat;
    if (running >= limit) {
      return setTimeout(function () {
        if(!aborted){getStats(source);}
      },10);
    }
    running++;
    stat(source, function (err, stats) {
      if (err) {return onError(err,
        function(){return getStats(source);});}

      // We need to get the mode from the stats object and preserve it.
      var item = {
        name: source,
        mode: stats.mode,
        mtime: stats.mtime, // modified time
        atime: stats.atime, // access time
        stats: stats // temporary
      };

      if (stats.isDirectory()) {
        return onDir(item);
      } else if (stats.isFile()) {
        return onFile(item);
      } else if (stats.isSymbolicLink()) {
        // Symlinks don't really need to know about the mode.
        return onLink(source);
      }
    });
  }

  function onFile (file) {
    var target = file.name.replace(currentPath, targetPath);
    isWritable(target, function (writable) {
      if (writable) {
        copyFile(file, target);
      } else {
        if (clobber) {
          rmFile(target, function () {
            copyFile(file, target);
          });
        } else {
          doneOne();
        }
      }
    });
  }

  function copyFile (file, target) {
    var readStream = fs.createReadStream(file.name);
    var writeStream = fs.createWriteStream(target, { mode: file.mode });

    var errFunc=function(err)
    {
      return onError(err,function(){return copyFile(file, target);});
    };
    readStream.on('error', errFunc);
    writeStream.on('error', errFunc);

    if (transform) {
      transform(readStream, writeStream, file);
    } else {
      writeStream.on('open', function () {
        readStream.pipe(writeStream);
      });
    }

    writeStream.once('finish', function () {
      fs.chmod(target, file.mode, function (err) {
        if (err) {return errFunc(err);}
        if (preserveTimestamps) {
          utimes.utimesMillis(target, file.atime, file.mtime, function (err) {
            if (err) {return errFunc(err);}
            return doneOne();
          });
        } else {
          doneOne();
        }
      });
    });
  }

  function rmFile (file, done) {
    var errFunc=function(err)
    {
      return onError(err,function(){return rmFile (file, done);});
    };
    fs.unlink(file, function (err) {
      if (err) {
        return errFunc(err);
      }

    return done();
  });
}

function onDir (dir) {
  var target = dir.name.replace(currentPath, targetPath);
  isWritable(target, function (writable) {
    if (writable) {
      return mkDir(dir, target);
    }
    copyDir(dir.name);
  });
}

function mkDir (dir, target) {
  var errFunc=function(err)
  {
    return onError(err,function(){return mkDir (dir, target);});
  };
  fs.mkdir(target, dir.mode, function (err) {
    if (err) {return errFunc(err);}
    // despite setting mode in fs.mkdir, doesn't seem to work
    // so we set it here.
    fs.chmod(target, dir.mode, function (err) {
      if (err){ return errFunc(err);}
      copyDir(dir.name);
    });
  });
}

function copyDir (dir) {
  var errFunc=function(err)
  {
    return onError(err,function(){return copyDir (dir);});
  };
  fs.readdir(dir, function (err, items) {
    if (err) {return errFunc(err);}
    items.forEach(function (item) {
      startCopy(path.join(dir, item));
    });
    return doneOne();
  });
}

function onLink (link) {
  var errFunc=function(err)
  {
    return onError(err,function(){return onLink (link);});
  };
  var target = link.replace(currentPath, targetPath);
  fs.readlink(link, function (err, resolvedPath) {
    if (err) {return errFunc(err);}
    checkLink(resolvedPath, target);
  });
}

function checkLink (resolvedPath, target) {
  var errFunc=function(err)
  {
    return onError(err,function(){return checkLink (resolvedPath, target) ;});
  };
  if (dereference) {
    resolvedPath = path.resolve(basePath, resolvedPath);
  }
  isWritable(target, function (writable) {
    if (writable) {
      return makeLink(resolvedPath, target);
    }
    fs.readlink(target, function (err, targetDest) {
      if (err) {return errFunc(err);}

      if (dereference) {
        targetDest = path.resolve(basePath, targetDest);
      }
      if (targetDest === resolvedPath) {
        return doneOne();
      }
      return rmFile(target, function () {
        makeLink(resolvedPath, target);
      });
    });
  });
}

function makeLink (linkPath, target) {
  var errFunc=function(err)
  {
    return onError(err,function(){return makeLink (linkPath, target) ;});
  };
  fs.symlink(linkPath, target, function (err) {
    if (err){ return errFunc(err);}
    return doneOne();
  });
}

function isWritable (path, done) {
  fs.lstat(path, function (err) {
    if (err) {
      if (err.code === 'ENOENT') {return done(true);}
      return done(false);
    }
    return done(false);
  });
}
function onError(err,retryCallback)
{
  pendingCallback(
  {
    error:err,
    ignore:function()
    {
      doneOne();
    },
    abort:function(){
      callback(err);
    },
    retry:function()
    {
      retryCallback();
    }
  });

}
function _onError (err) {
  if (options.stopOnError) {
    return callback(err);
  } else if (!errs && options.errs) {
    errs = fs.createWriteStream(options.errs);
  } else if (!errs) {
    errs = [];
  }
  if (typeof errs.write === 'undefined') {
    errs.push(err);
  } else {
    errs.write(err.stack + '\n\n');
  }
  return doneOne();
}

function doneOne (skipped) {
  if (!skipped){ running--;}
  finished++;
  if ((started === finished) && (running === 0)) {
    if (callback !== undefined) {
      return errs  && callback(errs) || callback(null);
    }
  }
}
}

module.exports = ncp;
