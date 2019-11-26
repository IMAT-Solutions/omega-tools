const fs = require('fs');
const micromatch = require('micromatch');
const path = require('path').posix;
const { readDeepDirs, makePathIfNeeded } = require('@imat/omegalib');

function saveFile(fname, srcList, verbose) {
  const timeLabel = 'Took';
  console.time(timeLabel);

  if (verbose) {
    process.stdout.write(`\x1b[s`);
  }

  fs.writeFileSync(fname, '// Auto generated file. Do not edit!!');
  srcList.forEach(
    srcName => {
      if (verbose) {
        process.stdout.write(`\x1b[u\x1b[s\x1b[K  ${srcName}`);
      }
      else {
        process.stdout.write('.');
      }
      const content = `\n\n//***********************************\n// Source File: ${srcName}\n` + fs.readFileSync(srcName);
      fs.appendFileSync(fname, content);
    }
  );

  if (verbose) {
    process.stdout.write('\x1b[u\x1b[K');
  }
  console.timeEnd(timeLabel);
}

// We need to concat if:
//   the dstFile does not exist
//   the dstFile date/time is older than any srcFile
function needToConcat(filtered, fileList, dstName) {
  let retVal = true;
  if (fs.existsSync(dstName)) {
    retVal = filtered.some(
      fname => {
        const srcTime = fileList[fname];
        const stat = fs.statSync(dstName);
        return (srcTime > Math.max(stat.mtimeMs, stat.ctimeMs));
      }
    );
  }

  return retVal;
}

function concatFiles({srcPath, dstPath, srcFiles, apps}, verbose = false) { //eslint-disable-line complexity
  if (!srcPath || typeof srcPath !== 'string') {
    console.error('\x1b[93mconcat.srcPath\x1b[0m must be a string of the source path.');
    return 0;
  }

  if (!dstPath || typeof dstPath !== 'string') {
    console.error('\x1b[93mconcat.dstPath\x1b[0m must be a string of the destination path.');
    return 0;
  }

  if (!Array.isArray(srcFiles) || srcFiles.length === 0) {
    console.error('\x1b[93mconcat.srcFiles\x1b[0m must be an array of filenames to include in the apps.');
    return 0;
  }

  if (typeof apps !== 'object' || Object.keys(apps).length === 0) {
    console.error('\x1b[93mconcat.apps\x1b[0m must be an object of app names/paths to concatinate.');
    return 0;
  }

  let cnt = 0;
  const readOptions = {
    ignore: ['test'],
    includeSrcPath: true,
    prependSlash: false,
    stats: true
  };
  const stats = readDeepDirs(srcPath, readOptions);
  const fileList = stats.reduce(
    (acc, stat) => {
      acc[stat.path] = Math.max(stat.mtimeMs, stat.ctimeMs);
      return acc;
    }, {}
  );

  Object.entries(apps).forEach(
    item => {
      var [name, paths] = item;
      var filteredSrcFiles = srcFiles.map(globPath => globPath.replace(/{paths}/g, paths));
      var mmOptions = {nodupes: true};
      const filtered = micromatch(Object.keys(fileList), filteredSrcFiles, mmOptions);
      const dstName = path.join(dstPath, name+'.app.js');
      if (needToConcat(filtered, fileList, dstName)) {
        console.log(`Building app "\x1b[93m${name}\x1b[0m"`);
        makePathIfNeeded(dstPath);
        saveFile(dstName, filtered, verbose);
        cnt++;
      }
    }
  );

  return cnt;
}

module.exports = concatFiles;
