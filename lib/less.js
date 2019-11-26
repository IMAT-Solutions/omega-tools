const debug = require('debug')('Omega:tool:build:less');
const fs = require('fs');
const glob = require('glob');
const less = require('less');
const path = require('path');
const { compareFiles, makePathIfNeeded, loadJsonFile } = require('@imat/omegalib');
const LESS_DEPENDENCIES_FILE = 'less.dependencies.json';

function checkAndCompile(srcName, dstName, dependencies) {
  return new Promise(
    (resolve, reject) => {
      if (fs.existsSync(srcName)) {
        const localDeps = dependencies[srcName]||[];
        const depList = [srcName, ...localDeps];
        const stat = fs.statSync(srcName);
        debug(`Dependency list: ${JSON.stringify(depList, 0, 2)}`);

        if (!stat.isDirectory() && depList.some(depName => compareFiles.isNewer(depName, dstName))) {
          makePathIfNeeded(path.dirname(dstName));
          var options = { filename: srcName };
          var src = fs.readFileSync(srcName, "utf8");

          less.render(src, options).then(
            output => {
              dependencies[srcName] = output.imports;
              fs.writeFileSync(dstName, output.css);
              console.log(`\x1b[93m${srcName}\x1b[32m → \x1b[93m${dstName}\x1b[0m`);
              resolve(1);
            },
            error => {
              console.error(`\x1b[93m${srcName}\x1b[91m Error \x1b[31m${error}\x1b[0m`);
              reject(error)
            }
          ).catch(
            ex => {
              console.error(ex);
              reject(ex);
            }
          );
        }
        else {
          resolve(0);
        }
      }
      else {
        resolve(0);
      }
    }
  );
}

function compileLess(list) {
  // Read in dependencies
  const dependencies = loadJsonFile(LESS_DEPENDENCIES_FILE) || {};
  var promises = Object.entries(list).map(
    ([srcName, dstName]) => {
      /* istanbul ignore if */
      if (glob.hasMagic(srcName) || glob.hasMagic(dstName)) {
        throw new Error('Globby Paths are not allowed for lessToCss.');
      }
      else {
        return checkAndCompile(srcName, dstName, dependencies);
      }
    }
  );

  return Promise.all(promises).then(
    countList => {
      // Save updated dependencies
      fs.writeFileSync(LESS_DEPENDENCIES_FILE, JSON.stringify(dependencies));
      return countList.reduce((acc, item) => acc + item, 0);
    }
  );
}

module.exports = compileLess;
