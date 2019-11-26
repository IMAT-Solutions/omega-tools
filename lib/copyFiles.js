const fs = require('fs');
const glob = require('glob');
const micromatch = require('micromatch');
const path = require('path');
const {
  endsInSlash,
  compareFiles,
  getFileArrayFromGlob,
  makePathIfNeeded,
  deleteFolderRecursive
} = require('@imat/omegalib');
const dstPathRe = /\/\:(\d+)/g;
function reReplace(srcFolder) {
  let parts = srcFolder.split('/');
  return (key, val) => {
    var i = parseInt(val, 10);
    if (i === 0) {
      return '/'+srcFolder;
    }

    if ((i < 0) || (i > parts.length)) {
      return '';
    }

    return '/'+parts.slice(i).join('/');
  }
}

function checkAndCopy(srcName, dstName, verbose) {
  let cnt = 0;
  if (!fs.existsSync(srcName)) {
    const pathParts = srcName.split(/[\\\/]/);
    const rootPath = pathParts.shift();
    if (rootPath.toLowerCase() === 'node_modules') {
      try {
        srcName = path.relative(process.cwd(), require.resolve(pathParts.join('/'))).replace(/\\/g, '/'); // eslint-disable-line no-param-reassign
      }

      catch(ex) {
        // Do nothing if the file does not exist.
      }
    }
  }

  if (fs.existsSync(srcName)) {
    const stat = fs.statSync(srcName);

    if (!stat.isDirectory() && !compareFiles.dateAndSize(srcName, dstName)) {
      makePathIfNeeded(path.dirname(dstName));
      if (verbose) {
        console.log(`\x1b[93m${srcName}\x1b[32m → \x1b[93m${dstName}\x1b[0m`);
      }
      else {
        process.stdout.write('.');
      }
      fs.copyFileSync(srcName, dstName);
      cnt=1;
    }
  }

  return cnt;
}

function copySingleFile(srcName, dstName, verbose) {
  return checkAndCopy(srcName, dstName, verbose);
}

function dstNameFromSrcName(srcName, dstKey) {
  let srcFolder = path.dirname(srcName);
  let dstName = srcName.replace(srcFolder, dstKey)
                       .replace(dstPathRe, reReplace(srcFolder))
                       .replace(/\/\//g, '/');
  return dstName;
}

function copyGlobFile(srcKey, dstKey, ignore, verbose) {
  var cnt = 0;
  getFileArrayFromGlob(process.cwd(), srcKey, {ignore}).forEach(
    srcName => {
      let dstName = dstNameFromSrcName(srcName, dstKey);
      cnt += checkAndCopy(srcName, dstName, verbose);
    }
  );

  return cnt;
}

function copyFiles(list, ignore=[], filesToDelete=false, verbose=false) {
  var cnt = 0;
  if (filesToDelete) {
    Object.entries(list).forEach(
      ([srcKey, dstKey]) => {
        filesToDelete.forEach(
          fileToDel => {
            const isMatch = micromatch.isMatch(fileToDel, srcKey);
            if (isMatch) {
              const delName = dstNameFromSrcName(fileToDel, dstKey);
              if (fs.existsSync(delName)) {
                let stats = fs.statSync(delName);
                if (stats.isDirectory()) {
                  if (verbose) {
                    console.log(`\x1b[91mRemove Folder \x1b[93m${delName}\x1b[0m`);
                  }
                  deleteFolderRecursive(delName);
                }
                else {
                  if (verbose) {
                    console.log(`\x1b[91mRemove File \x1b[93m${delName}\x1b[0m`);
                  }
                  fs.unlinkSync(delName);
                }
              }
            }
          }
        );
      }
    );
  }

  Object.entries(list).forEach(
    ([srcKey, dstKey]) => {
      if (glob.hasMagic(srcKey)) {
        if (glob.hasMagic(dstKey)) {
          throw new Error('The destination path can not be globby.');
        }
        if (endsInSlash(dstKey)) {
          throw new Error('The destination path can not end with a slash.');
        }
        cnt += copyGlobFile(srcKey, dstKey, ignore, verbose);
      }
      else {
        cnt += copySingleFile(srcKey, dstKey, verbose);
      }
    }
  );

  if (!verbose) {
    console.log('');
  }

  return cnt;
}

module.exports = copyFiles;
