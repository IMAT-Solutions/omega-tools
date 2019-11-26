/* eslint-env mocha */
const expect = require('chai').expect;
const proxyquire = require('proxyquire').noCallThru();
let output = '';
class StatMock {
  constructor(size = 0, delta = 0) {
    this.size = 527+size;
    this.mtimeMs = 1318289051000.1+delta;
    this.ctimeMs = 1318289051000.1+delta;
    this._isFolder = false;
  }

  isDirectory() {
    return this._isFolder;
  }
}
var loadData;
var fileData;
const fsStub = {
  appendFileSync: (fname, content) => {
    loadData.files[fname] += content;
  },
  existsSync: fname => { // eslint-disable-line no-unused-vars
    return !!fileData[fname];
  },
  readFileSync: fname => {
    if (fileData[fname]) {
      return fileData[fname].content;
    }

    const err = new Error(`ENOENT: no such file or directory, open '${fname}'`);
    err.code = 'ENOENT';
    err.errno = -4058;
    err.path = fname;
    err.syscell = 'open';

    throw err;
  },
  statSync: fname => {
    if (fileData[fname]) {
      return fileData[fname].stat;
    }

    const err = new Error(`ENOENT: no such file or directory, stat '${fname}'`);
    err.code = 'ENOENT';
    err.errno = -4058;
    err.path = fname;
    err.syscell = 'stat';

    throw err;
  },
  writeFileSync: (fname, content) => {
    loadData.files[fname] = content;
  }
};

const mockStdoutWrite = str => {
  output += str;
}

const makePathIfNeededStub = dstPath => { // eslint-disable-line no-unused-vars
  // Do nothing. Just pretend to always create the path
}

const readDeepDirsStub = () => {
  return Object.entries(fileData).map(
    ([fname, data]) => ({...data.stat, path: fname})
  );
}

const omegaStub = {
  makePathIfNeeded: makePathIfNeededStub,
  readDeepDirs: readDeepDirsStub
}

const stubs = {
  'fs': fsStub,
  '@imat/omegalib': omegaStub
}
const concatFiles = proxyquire('./concatFiles', stubs);

describe('concatFiles tests', function() {
  const realStdoutWrite = process.stdout.write;
  const realConsoleLog = console.log;

  afterEach(() => {
    process.stdout.write = realStdoutWrite;
    console.log = realConsoleLog;
  })
  beforeEach(() => {
    output = '';
    fileData = {};
    loadData = {files:{}};
  });

  it('should init', function() {
    expect(concatFiles).to.be.a('function');
  });

  it('should handle concat with no previous dst file', function() {
    const dstFileName = 'dist/static/js/test.app.js';
    const options = {
      "apps": {
        "test": "test"
      },
      "dstPath": "dist/static/js",
      "srcFiles": [
        "src/ui/test/**/*.js"
      ],
      "srcPath": "src"
    }

    fileData['src/ui/test/first.js'] = {
      content: "function firstFunc(val) {\n  return val.toUpperCase();\n}\n",
      stat: new StatMock()
    };
    fileData['src/ui/test/second.js'] = {
      content: "var secondVar = 'testing';\n",
      stat: new StatMock()
    };
    fileData['src/ui/test/third/num3.js'] = {
      content: "// This is the third file.\nreturn firstFunc(secondVar);\n",
      stat: new StatMock()
    };
    process.stdout.write = mockStdoutWrite;
    console.log = ()=>{};
    const cnt = concatFiles(options);
    process.stdout.write = realStdoutWrite;
    console.log = realConsoleLog;

    var fn = new Function(loadData.files[dstFileName]); // eslint-disable-line no-new-func
    const res = fn();
    expect(cnt).to.equal(1);
    expect(res).to.equal('TESTING');
    expect(output).to.equal('...');
  });

  it('should handle concat with no previous dst file-verbose', function() {
    const dstFileName = 'dist/static/js/test.app.js';
    const options = {
      "apps": {
        "test": "test"
      },
      "dstPath": "dist/static/js",
      "srcFiles": [
        "src/ui/test/**/*.js"
      ],
      "srcPath": "src"
    }

    fileData['src/ui/test/first.js'] = {
      content: "function firstFunc(val) {\n  return val.toUpperCase();\n}\n",
      stat: new StatMock()
    };
    fileData['src/ui/test/second.js'] = {
      content: "var secondVar = 'testing';\n",
      stat: new StatMock()
    };
    fileData['src/ui/test/third/num3.js'] = {
      content: "// This is the third file.\nreturn firstFunc(secondVar);\n",
      stat: new StatMock()
    };
    process.stdout.write = mockStdoutWrite;
    console.log = ()=>{};
    const cnt = concatFiles(options, true);
    process.stdout.write = realStdoutWrite;
    console.log = realConsoleLog;

    var fn = new Function(loadData.files[dstFileName]); // eslint-disable-line no-new-func
    const res = fn();
    expect(cnt).to.equal(1);
    expect(res).to.equal('TESTING');
    expect(output).to.equal('\u001b[s\u001b[u\u001b[s\u001b[K  src/ui/test/first.js\u001b[u\u001b[s\u001b[K  src/ui/test/second.js\u001b[u\u001b[s\u001b[K  src/ui/test/third/num3.js\u001b[u\u001b[K');
  });

  it('should handle concat if prev dst file is older', function() {
    const dstFileName = 'dist/static/js/test.app.js';
    const options = {
      "apps": {
        "test": "test"
      },
      "dstPath": "dist/static/js",
      "srcFiles": [
        "src/ui/test/**/*.js"
      ],
      "srcPath": "src"
    }

    fileData[dstFileName] = {
      content: "",
      stat: new StatMock(0, -3)
    }
    fileData['src/ui/test/first.js'] = {
      content: "var a = 12;\n",
      stat: new StatMock()
    };
    fileData['src/ui/test/second.js'] = {
      content: "var b = 34;\n",
      stat: new StatMock()
    };
    fileData['src/ui/test/third/num3.js'] = {
      content: "return `${a} + ${b} = ${a+b}`;\n", // eslint-disable-line no-template-curly-in-string
      stat: new StatMock()
    };
    const cnt = concatFiles(options);
    var fn = new Function(loadData.files[dstFileName]); // eslint-disable-line no-new-func
    const res = fn();
    expect(cnt).to.equal(1);
    expect(res).to.equal('12 + 34 = 46');
  });

  it('should handle no-concat if prev dst file newer', function() {
    const dstFileName = 'dist/static/js/test.app.js';
    const options = {
      "apps": {
        "test": "test"
      },
      "dstPath": "dist/static/js",
      "srcFiles": [
        "src/ui/test/**/*.js"
      ],
      "srcPath": "src"
    }

    fileData[dstFileName] = {
      content: "",
      stat: new StatMock(0, 3)
    }
    fileData['src/ui/test/first.js'] = {
      content: "function firstFunc(val) {\n  return val.toUpperCase();\n}\n",
      stat: new StatMock()
    };
    fileData['src/ui/test/second.js'] = {
      content: "var secondVar = 'testing';\n",
      stat: new StatMock()
    };
    fileData['src/ui/test/third/num3.js'] = {
      content: "// This is the third file.\nreturn firstFunc(secondVar);\n",
      stat: new StatMock()
    };
    const cnt = concatFiles(options);
    expect(cnt).to.equal(0);
    expect(loadData.files[dstFileName]).to.equal(undefined);
  });

  it('should handle no apps', function() {
    const realError = console.error;
    let errorMessage = '';
    console.error = (msg, ...args) => {
      errorMessage += msg;
      expect(args.length).to.equal(0);
    }
    const options = {
      "dstPath": "dist/static/js",
      "srcFiles": [
        "src/ui/test/**/*.js"
      ],
      "srcPath": "src"
    }

    const cnt = concatFiles(options);
    console.error = realError;
    expect(cnt).to.equal(0);
    expect(errorMessage).to.equal('\x1b[93mconcat.apps\x1b[0m must be an object of app names/paths to concatinate.');
  });


  it('should handle no srcPath', function() {
    const realError = console.error;
    let errorMessage = '';
    console.error = (msg, ...args) => {
      errorMessage += msg;
      expect(args.length).to.equal(0);
    }
    const options = {
      "apps": {
        "test": "test"
      },
      "dstPath": "dist/static/js",
      "srcFiles": [
        "src/ui/test/**/*.js"
      ]
    }

    const cnt = concatFiles(options);
    console.error = realError;
    expect(cnt).to.equal(0);
    expect(errorMessage).to.equal('\x1b[93mconcat.srcPath\x1b[0m must be a string of the source path.');
  });

  it('should handle no dstPath', function() {
    const realError = console.error;
    let errorMessage = '';
    console.error = (msg, ...args) => {
      errorMessage += msg;
      expect(args.length).to.equal(0);
    }
    const options = {
      "apps": {
        "test": "test"
      },
      "srcFiles": [
        "src/ui/test/**/*.js"
      ],
      "srcPath": "src"
    }

    const cnt = concatFiles(options);
    console.error = realError;
    expect(cnt).to.equal(0);
    expect(errorMessage).to.equal('\x1b[93mconcat.dstPath\x1b[0m must be a string of the destination path.');
  });

  it('should handle no srcFiles', function() {
    const realError = console.error;
    let errorMessage = '';
    console.error = (msg, ...args) => {
      errorMessage += msg;
      expect(args.length).to.equal(0);
    }
    const options = {
      "apps": {
        "test": "test"
      },
      "dstPath": "dist/static/js",
      "srcFiles": [],
      "srcPath": "src"
    }

    const cnt = concatFiles(options);
    console.error = realError;
    expect(cnt).to.equal(0);
    expect(errorMessage).to.equal('\x1b[93mconcat.srcFiles\x1b[0m must be an array of filenames to include in the apps.');
  });
});
