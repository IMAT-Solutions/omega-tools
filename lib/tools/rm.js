const path = require('path');
const {deleteFolderRecursive} = require('@imat/omegalib');

function rm(argv) {
  return new Promise(
    (resolve, reject) => {
      if (argv.length > 0) {
        argv.forEach(
          rmPath => {
            const rootPath = path.join(process.cwd(), rmPath);
            console.log(`Removing all files and folders from '${rmPath}'`);
            deleteFolderRecursive(rootPath);
          }
        );

        resolve();
      }
      else {
        console.error('No path provided.')
        reject(new Error(1));
      }
    }
  );
}

module.exports = rm;
