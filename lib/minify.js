const fs = require('fs');
const path = require('path');
const uglify = require("uglify-es");
const { compareFiles, getFileArrayFromGlob } = require('@imat/omegalib');
const BYTE_COUNT = 1024;
const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

function fileSize(size) {
  let i;
  /* istanbul ignore next */
  for(i = 0; size > BYTE_COUNT; i++) {
    size = size / BYTE_COUNT; // eslint-disable-line no-param-reassign
  }

  return Math.max(size, 0.1).toLocaleString() + UNITS[i];
}

function minifyJs(fileList, verbose) {
  let cnt = 0;
  let percent = 0;
  getFileArrayFromGlob(process.cwd(), fileList).forEach(fname => {
    const ext = path.extname(fname);
    const extRe = new RegExp(`${ext}$`);
    const minName = fname.replace(extRe, `.min${ext}`);
    if (compareFiles.isNewer(fname, minName)) {
      const code = fs.readFileSync(fname, 'utf8');
      const before = code.length;
      const result = uglify.minify(code);

      /* istanbul ignore if */
      if (result.error) {
        console.error(result.error); // runtime error, or `undefined` if no error
      }
      else {
        const after = result.code.length;
        const temp = 100 - (after*100/before);
        percent += temp;
        if (verbose) {
          console.log(`Minified: \x1b[93m${fname}\x1b[0m from \x1b[32m${fileSize(before)}\x1b[0m to \x1b[32m${fileSize(after)}\x1b[0m (${temp.toFixed(2)}% reduction).`);
        }
        else {
          process.stdout.write('.');
        }
        fs.writeFileSync(minName, result.code, 'utf8');
        cnt++;
      }
    }
  });

  if (!verbose) {
    console.log('');
  }

  return {cnt, percent: percent/(cnt||1)};
}

function minifyCss(/*fileList, verbose*/) {
  // TODO: Create minified versions of the CSS files passed in as `fileList`
  return 0;
}

module.exports = {js: minifyJs, css: minifyCss};
