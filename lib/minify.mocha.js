/* eslint-env mocha */
const expect = require('chai').expect;
const proxyquire = require('proxyquire').noCallThru();

let savedFiles;
const mockFiles = {
  'src/one/one.js': {time: 10, content: '// testing\nvar a = 10;\nvar b = 20;\nconsole.log(a);'},
  'src/two/second.js': {time: 19, content: 'function fileSize(size) {\n    let i;\n    for(i = 0; size > BYTE_COUNT; i++) {\n      size = size / BYTE_COUNT; // eslint-disable-line no-param-reassign\n    }\n\n    return Math.max(size, 0.1).toLocaleString() + UNITS[i];\n  }\n'},
  'src/two/second.min.js': {time: 9, content: ''},
  'src/animals/dog.js': {time: 22, content: 'function minifyCss(/*fileList, verbose*/) {\n    // TODO: Create minified versions of the CSS files passed in as `fileList`\n    return 0;\n  }\n'},
  'src/animals/cat.js': {time: 24, content: ''},
  'src/animals/cat.min.js': {time: 25, content: ''}
};

const compareFilesMock = {
  isNewer(srcFile, dstFile) {
    return (!mockFiles[dstFile] || mockFiles[srcFile].time > mockFiles[dstFile].time);
  }
};

const getFileArrayFromGlobMock = () => {
  return Object.keys(mockFiles).filter(item => !item.includes('.min.js'));
};

const stubs = {
  'fs': {
    readFileSync(fname) {
      return mockFiles[fname].content;
    },

    writeFileSync(fname, content) {
      savedFiles[fname] = content;
    }
  },
  '@imat/omegalib': {
    compareFiles: compareFilesMock,
    getFileArrayFromGlob: getFileArrayFromGlobMock
  }
}

const minify = proxyquire('./minify', stubs);

describe('lib/minify.js tests', function() {
  beforeEach(() => {
    savedFiles = {};
  });

  it('should init', function() {
    expect(minify).to.be.an('object');
    expect(minify.js).to.be.a('function');
    expect(minify.css).to.be.a('function');
  });

  describe('minify.js() function tests', function() {
    it('should processFiles - non-verbose', function() {
      let output = '';
      const realLog = console.log;
      const realWrite = process.stdout.write;
      console.log = () => {};
      process.stdout.write = str => (output+=str);
      minify.js();
      console.log = realLog;
      process.stdout.write = realWrite;

      const savedNames = Object.keys(savedFiles);
      expect(savedNames.length).to.equal(3);
      const expectedData = {
        'src/one/one.min.js': 'var a=10,b=20;console.log(a);',
        'src/two/second.min.js': 'function fileSize(t){let e;for(e=0;t>BYTE_COUNT;e++)t/=BYTE_COUNT;return Math.max(t,.1).toLocaleString()+UNITS[e]}',
        'src/animals/dog.min.js': 'function minifyCss(){return 0}'
      }
      expect(savedFiles).to.eql(expectedData);
      expect(output).to.equal('...');
    });

    it('should processFiles - verbose', function() {
      let output = '';
      const realLog = console.log;
      const realWrite = process.stdout.write;
      process.stdout.write = () => {};
      console.log = str => (output+=str);
      minify.js(true, true);
      console.log = realLog;
      process.stdout.write = realWrite;

      const savedNames = Object.keys(savedFiles);
      expect(savedNames.length).to.equal(3);
      const expectedData = {
        'src/one/one.min.js': 'var a=10,b=20;console.log(a);',
        'src/two/second.min.js': 'function fileSize(t){let e;for(e=0;t>BYTE_COUNT;e++)t/=BYTE_COUNT;return Math.max(t,.1).toLocaleString()+UNITS[e]}',
        'src/animals/dog.min.js': 'function minifyCss(){return 0}'
      }
      expect(savedFiles).to.eql(expectedData);
      output = output.replace(/\d+(\.\d+)?\% /g, '');
      expect(output).to.equal('Minified: \u001b[93msrc/one/one.js\u001b[0m from \u001b[32m50B\u001b[0m to \u001b[32m29B\u001b[0m (reduction).Minified: \u001b[93msrc/two/second.js\u001b[0m from \u001b[32m222B\u001b[0m to \u001b[32m114B\u001b[0m (reduction).Minified: \u001b[93msrc/animals/dog.js\u001b[0m from \u001b[32m141B\u001b[0m to \u001b[32m30B\u001b[0m (reduction).');
    });
  });

  describe('minify.css() function tests', function() {
    it('should return 0', function() {
      // THIS IS A PLACEHOLDER UNTIL
      // WE HAVE REAL CSS MINIFICATION
      expect(minify.css()).to.equal(0);
    });
  });
});
