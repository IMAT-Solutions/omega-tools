const debug = require('debug')('Omega:tool:build');
const fs = require('fs');
const {removeFiles, loadJsonFile} = require('@imat/omegalib');
const copyFiles = require('../copyFiles');
const concatFiles = require('../concatFiles');
const docs = require('./docs');
const less = require('../less');
const minify = require('../minify');
const minimist = require('minimist');
const DEFAULT_BUILD_FILE = 'build.config.json';
const versionCheck = require('../versionCheck');

// Figure out which files should be deleted
function getFilesToDelete(listOfFiles) {
  var filesToDelete = listOfFiles || false;

  if (filesToDelete) {
    if (!Array.isArray(filesToDelete)) {
      filesToDelete = [filesToDelete];
    }

    debug(`List of files to delete from '--del':\n${JSON.stringify(filesToDelete, 0, 2)}`)
    // Remove any single or double quotes surrounding each entry.
    filesToDelete = filesToDelete.map(fname => fname.replace(/^(['"])(.+)\1$/, '$2'));
  }

  return filesToDelete;
}

function copyAndDeleteFiles(filesToCopy, filesToDelete, filesToRemove, filesToIgnore, verbose) {
  let copyCount = 0;
  let removedCount = 0;
  // 1) Delete any files that should be deleted
  // 2) Copy the files that should be copied
  // 3) Ignore the files that should not be copied
  if (typeof filesToCopy === 'object' || filesToDelete) {
    console.log(`\x1b[96mCopying Files\x1b[0m`);
    debug(JSON.stringify(filesToCopy, 0, 2));
    copyCount = copyFiles(filesToCopy, filesToIgnore, filesToDelete, verbose);
  }

  // Remove any files that were copied because they could not be ignored and still need to be removed
  if (filesToRemove) {
    console.log(`\x1b[96mRemoving Files\x1b[0m`);
    debug(JSON.stringify(filesToRemove, 0, 2));
    removedCount = removeFiles(filesToRemove);
  }

  return {copyCount, removedCount};
}

// Build the various apps
function buildApps(concat) {
  let buildCount = 0;

  if (concat) {
    console.log(`\x1b[96mConcatenating Files\x1b[0m`);
    debug(JSON.stringify(concat, 0, 2));
    buildCount = concatFiles(concat);
  }

  return buildCount;
}

// Convert from LESS to CSS
function processLess(lesstocss) {
  if (lesstocss) {
    console.log(`\x1b[96mCompiling less Files\x1b[0m`);
    debug(JSON.stringify(lesstocss, 0, 2));
    return less(lesstocss);
  }

  return Promise.resolve(0);
}

function doMinify(minifyCfg, verbose) {
  const retVal = {
    minifiedjs: 0,
    percentjs: 0
  };
  // Minify anything that needs to be minified
  if (minifyCfg) {
    // Minify the JS files
    if (minifyCfg.js) {
      console.log(`\x1b[96mMinifying JS Files\x1b[0m`);
      debug(JSON.stringify(minifyCfg.js, 0, 2));
      let temp = minify.js(minifyCfg.js, verbose);

      retVal.minifiedjs = temp.cnt;
      retVal.percentjs = temp.percent;
    }

    /*
    TODO: Allow for minification of CSS files.
    // Minify the CSS files
    if (config.minify.css) {
      minifiedcss = minify.css(config.minify.css);
    }

    TODO: Consider addingminifiers for HTML, XML, JSON and SVG
    */
  }

  return retVal;
}

function build(argv) {
  if (!versionCheck()) {
    process.exit(1);
  }
  let config;
  const args = minimist(argv);
  const configFile = args._[0] || DEFAULT_BUILD_FILE;

  if (!fs.existsSync(configFile)) {
    console.error(`\x1b[31mThe config file \x1b[91m'${configFile}' \x1b[31mwas not found.\x1b[0m`);
    return Promise.reject(new Error(1));
  }

  try {
    debug(`Config file: ${configFile}`)
    config = loadJsonFile(configFile);
    if (!config) {
      console.error(`\x1b[31mThe config file \x1b[91m${configFile} \x1b[31mwas empty.\x1b[0m`);
      return Promise.reject(new Error(2));
    }
  }

  catch(ex) {
    console.error(`\x1b[31mUnable to parse the file \x1b[91m${configFile}\x1b[0m`);
    console.error(ex.stack);
    return Promise.reject(new Error(3));
  }

  debug(`config values:\n${JSON.stringify(config, 0, 2)}`)
  return new Promise(
    (resolve, reject) => {
      let concatCount = 0;
      let copyCount = 0;
      let removedCount = 0;
      const doConcat = !(args.noconcat === 'true' || args.noconcat === true);
      const verbose = (args.verbose === 'true' || args.verbose === true);

      // Figure out which files should be deleted
      let filesToDelete = getFilesToDelete(args.del);

      // Copy files, delete files that were deleted from source folder and files that are explicitly to be removed.
      let temp = copyAndDeleteFiles(config.filestocopy, filesToDelete, config.filestoremove, config.filestoignore, verbose);
      copyCount = temp.copyCount;
      removedCount = temp.removedCount;

      if (doConcat) {
        concatCount = buildApps(config.concat, verbose);
      }

      let promises = [processLess(config.lesstocss, verbose), docs({})];

      Promise.all(promises).then(
        values => {
          const {minifiedjs, percentjs} = doMinify(config.minify, verbose);

          console.log(`${copyCount} \x1b[92mfiles copied\x1b[0m`);
          console.log(`${removedCount} \x1b[92mfiles removed\x1b[0m`);
          if (doConcat) {
            console.log(`${concatCount} \x1b[92mapps concatenated\x1b[0m`);
          }
          console.log(`${values[0]} \x1b[92m.less files compiled\x1b[0m`);
          console.log(`${minifiedjs} \x1b[92mjs files minified: (${percentjs.toFixed(2)}% average reduction)\x1b[0m`);
          resolve();
        }
      ).catch(
        ex => {
          console.error(`\x1b[31mLESS compilation error\x1b[0m`);
          console.error(ex.stack);
          reject(new Error(4));
        }
      );
    }
  );
}

module.exports = build;
