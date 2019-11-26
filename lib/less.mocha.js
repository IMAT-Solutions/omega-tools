/* eslint-env mocha */
const expect = require('chai').expect;
const proxyquire = require('proxyquire').noCallThru();

const stat = {
  isDirectory() {
    return false;
  }
}
let savedFiles;
const mockFiles = {
  'src/one/one.less': {time: 10, stat, content: '.cat {\nbackground-color:green;\n  &:hover {\n    backgorund-color: red;\n  }\n}'},
  'src/two/second.less': {time: 10, stat, content: ''},
  'src/bad.less': {time: 10, stat, content: '.cat {\nbackground-color:green;\n'},
  'dist/second.css': {time: 11, stat, content: ''}
};

const compareFilesMock = {
  isNewer(srcFile, dstFile) {
    return (!mockFiles[dstFile] || mockFiles[srcFile].time > mockFiles[dstFile].time);
  }
};

const makePathIfNeededMock = () => {};
const loadJsonFileMock = () => ({});

const stubs = {
  'fs': {
    existsSync(fname) {
      return !!mockFiles[fname];
    },

    readFileSync(fname) {
      return mockFiles[fname].content;
    },

    statSync(fname) {
      return mockFiles[fname].stat;
    },

    writeFileSync(fname, content) {
      if (fname !== 'less.dependencies.json') {
        savedFiles[fname] = content;
      }
    }
  },
  '@imat/omegalib': {
    compareFiles: compareFilesMock,
    makePathIfNeeded: makePathIfNeededMock,
    loadJsonFile: loadJsonFileMock
  }
}

const less = proxyquire('./less', stubs);

describe('lib/less.js tests', function() {
  beforeEach(() => {
    savedFiles = {};
  });

  it('should init', function() {
    expect(less).to.be.a('function');
  });

  it('should handle an empty list', function() {
    return less({}).then(
      cnt => {
        expect(cnt).to.equal(0);
      }
    );
  });

  it('should handle a single file', function() {
    return less({'src/one/one.less': 'dist/one.css'}).then(
      cnt => {
        expect(cnt).to.equal(1);
        const expectedData = {"dist/one.css": ".cat {\n  background-color: green;\n}\n.cat:hover {\n  backgorund-color: red;\n}\n"};
        expect(savedFiles).to.eql(expectedData);
      }
    );
  });

  it('should handle a list of files', function() {
    const list = {
      'src/one/one.less': 'dist/one.css',
      'src/two/second.less': 'dist/second.css'
    };
    return less(list).then(
      cnt => {
        expect(cnt).to.equal(1);
        const expectedData = {"dist/one.css": ".cat {\n  background-color: green;\n}\n.cat:hover {\n  backgorund-color: red;\n}\n"};
        expect(savedFiles).to.eql(expectedData);
      }
    );
  });

  it('should handle a bad file', function(done) {
    less({'src/bad.less': 'dist/bad.css'}).then(
      () => {
        done(new Error('Should have thrown an error and did not.'));
      }
    ).catch(
      ex => {
        expect(ex.message).to.equal('Unrecognised input. Possibly missing something');
        done();
      }
    ).catch(
      ex => done(ex)
    );
  });
});
