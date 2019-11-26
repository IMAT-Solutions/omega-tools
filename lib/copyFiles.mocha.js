/* eslint-env mocha */
const expect = require('chai').expect;
const proxyquire = require('proxyquire').noCallThru();
const omegalib = require('@imat/omegalib');
class StatMock {
  constructor() {
    this.dev = 2114;
    this.ino = 48064969;
    this.mode = 33188;
    this.nlink = 1;
    this.uid = 85;
    this.gid = 100;
    this.rdev = 0;
    this.size = 527;
    this.blksize = 4096;
    this.blocks = 8;
    this.atimeMs = 1318289051000.1;
    this.mtimeMs = 1318289051000.1;
    this.ctimeMs = 1318289051000.1;
    this.birthtimeMs = 1318289051000.1;
    this.atime = 'Mon 10 Oct 2011 23:24:11 GMT';
    this.mtime = 'Mon 10 Oct 2011 23:24:11 GMT';
    this.ctime = 'Mon 10 Oct 2011 23:24:11 GMT';
    this.birthtime = 'Mon 10 Oct 2011 23:24:11 GMT';
    this._isFolder = false;
  }

  isDirectory() {
    return this._isFolder;
  }
}
var loadData;
var fileExists;
var noNeedToCopy;
var statMock = {};
const fsStub = {
  copyFileSync: (src, dst) => {
    loadData.push({src,dst});
  },
  existsSync: fname => { // eslint-disable-line no-unused-vars
    return fileExists
  },
  statSync: fname => {
    if (statMock[fname]) {
      return statMock[fname];
    }

    const err = new Error(`ENOENT: no such file or directory, stat '${fname}'`);
    err.code = 'ENOENT';
    err.errno = -4058;
    err.path = fname;
    err.syscell = 'stat';

    throw err;
  }
};

const deleteFolderRecursiveStub = (folder) => { // eslint-disable-line no-unused-vars
  // TODO: Add tests for deleting folders.
}

const compareFilesStub = {
  dateAndSize() {
    return noNeedToCopy;
  }
};

const gFAFGStub = (cwd, path) => {
  if (path === 'bad/**/*.*') {
    return [];
  }

  return [
    'copy/one.js',
    'copy/two.html',
    'copy/sub1/1.1',
    'copy/sub1/2.lsp',
    'copy/sub2/sub3/sub4/1.2.3'
  ]
};

const mPINStub = dstPath => { // eslint-disable-line no-unused-vars
  // Do nothing. Just pretend to always create the path
}

const omegaStub = {
  compareFiles: compareFilesStub,
  deleteFolderRecursive: deleteFolderRecursiveStub,
  endsInSlash: omegalib.endsInSlash,
  getFileArrayFromGlob: gFAFGStub,
  makePathIfNeeded: mPINStub
}

const stubs = {
  'fs': fsStub,
  '@imat/omegalib': omegaStub
}
const copyFiles = proxyquire('./copyFiles', stubs);

describe('copyFiles tests', function() {
  beforeEach(() => {
    statMock = {};
    fileExists = false;
    loadData = [];
    noNeedToCopy = false;
  });

  it('should init', function() {
    expect(copyFiles).to.be.a('function');
  });

  it('should NOT copy a non-existant file', function() {
    copyFiles({'./copyFiles.mocha.js': '../test/filename.js'});
    expect(loadData.length).to.equal(0);
  });

  it('should copy a single file', function() {
    let file1 = './copyFiles.mocha.js';
    let file2 = '../test/filename.js';
    fileExists = true;
    statMock[file1] = new StatMock();
    statMock[file2] = new StatMock();
    copyFiles({[file1]: file2});
    expect(loadData.length).to.equal(1);
    expect(loadData[0].src).to.equal(file1);
    expect(loadData[0].dst).to.equal(file2);
  });

  it('should NOT copy a bad glob path', function() {
    copyFiles({'bad/**/*.*': '../test'});
    expect(loadData.length).to.equal(0);
  });

  it('should NOT copy with a glob dst path', function() {
    const badFn = () => {
      copyFiles({'bad/**/*.*': '../test/**'});
    }
    expect(badFn).to.throw();
  });

  it('should NOT copy with a slash at end of dst path', function() {
    const badFn = () => {
      copyFiles({'bad/**/*.*': '../test/'});
    }
    expect(badFn).to.throw();
  });

  it('should NOT copy if not needed', function() {
    let file1 = 'copy/one.js';
    let file2 = '../test/one.js';
    fileExists = true;
    noNeedToCopy = true;
    statMock[file1] = new StatMock();
    statMock[file2] = new StatMock();
    copyFiles({[file1]: '../test/'});
  });

  it('should copy glob files with no path id', function() {
    let srcFiles = ['copy/one.js', 'copy/two.html', 'copy/sub1/1.1', 'copy/sub1/2.lsp', 'copy/sub2/sub3/sub4/1.2.3'];
    let dstFiles = ['../test/one.js', '../test/two.html', '../test/1.1', '../test/2.lsp', '../test/1.2.3'];

    for(let i = 0; i < 5; i++) {
      statMock[srcFiles[i]] = new StatMock();
      statMock[dstFiles[i]] = new StatMock();
    }

    fileExists = true;
    copyFiles({'copy/**/*.*': '../test'});
    expect(loadData.length).to.equal(5);
    for(let i = 0; i < 5; i++) {
      expect(loadData[i].src).to.equal(srcFiles[i]);
      expect(loadData[i].dst).to.equal(dstFiles[i]);
    }
  });

  it('should copy glob files with path is `:1`', function() {
    let srcFiles = ['copy/one.js', 'copy/two.html', 'copy/sub1/1.1', 'copy/sub1/2.lsp', 'copy/sub2/sub3/sub4/1.2.3'];
    let dstFiles = ['../test/one.js', '../test/two.html', '../test/sub1/1.1', '../test/sub1/2.lsp', '../test/sub2/sub3/sub4/1.2.3'];

    for(let i = 0; i < 5; i++) {
      statMock[srcFiles[i]] = new StatMock();
      statMock[dstFiles[i]] = new StatMock();
    }

    fileExists = true;
    copyFiles({'./copy/**/*.*': '../test/:1'});
    expect(loadData.length).to.equal(5);
    for(let i = 0; i < 5; i++) {
      expect(loadData[i].src).to.equal(srcFiles[i]);
      expect(loadData[i].dst).to.equal(dstFiles[i]);
    }
  });

  it('should copy glob files with path is `:0`', function() {
    let srcFiles = ['copy/one.js', 'copy/two.html', 'copy/sub1/1.1', 'copy/sub1/2.lsp', 'copy/sub2/sub3/sub4/1.2.3'];
    let dstFiles = ['../test/copy/one.js', '../test/copy/two.html', '../test/copy/sub1/1.1', '../test/copy/sub1/2.lsp', '../test/copy/sub2/sub3/sub4/1.2.3'];

    for(let i = 0; i < 5; i++) {
      statMock[srcFiles[i]] = new StatMock();
      statMock[dstFiles[i]] = new StatMock();
    }

    fileExists = true;
    copyFiles({'copy/**/*.*': '../test/:0'});
    expect(loadData.length).to.equal(5);
    for(let i = 0; i < 5; i++) {
      expect(loadData[i].src).to.equal(srcFiles[i]);
      expect(loadData[i].dst).to.equal(dstFiles[i]);
    }
  });

  it('should copy glob files with path is `:2`', function() {
    let srcFiles = ['copy/one.js', 'copy/two.html', 'copy/sub1/1.1', 'copy/sub1/2.lsp', 'copy/sub2/sub3/sub4/1.2.3'];
    let dstFiles = ['../test/one.js', '../test/two.html', '../test/1.1', '../test/2.lsp', '../test/sub3/sub4/1.2.3'];

    for(let i = 0; i < 5; i++) {
      statMock[srcFiles[i]] = new StatMock();
      statMock[dstFiles[i]] = new StatMock();
    }

    fileExists = true;
    copyFiles({'copy/**/*.*': '../test/:2'});
    expect(loadData.length).to.equal(5);
    for(let i = 0; i < 5; i++) {
      expect(loadData[i].src).to.equal(srcFiles[i]);
      expect(loadData[i].dst).to.equal(dstFiles[i]);
    }
  });

  it('should copy glob files with path is `:9`', function() {
    let srcFiles = ['copy/one.js', 'copy/two.html', 'copy/sub1/1.1', 'copy/sub1/2.lsp', 'copy/sub2/sub3/sub4/1.2.3'];
    let dstFiles = ['../test/one.js', '../test/two.html', '../test/1.1', '../test/2.lsp', '../test/1.2.3'];

    for(let i = 0; i < 5; i++) {
      statMock[srcFiles[i]] = new StatMock();
      statMock[dstFiles[i]] = new StatMock();
    }

    fileExists = true;
    copyFiles({'copy/**/*.*': '../test/:9'});
    expect(loadData.length).to.equal(5);
    for(let i = 0; i < 5; i++) {
      expect(loadData[i].src).to.equal(srcFiles[i]);
      expect(loadData[i].dst).to.equal(dstFiles[i]);
    }
  });
});
