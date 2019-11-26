/* eslint-env mocha */
const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const fixPath = fname => fname.replace(/^[A-Z]:\\|\\/g, '/');
//const cwd = fixPath(process.cwd());

let copyPaths = [];
let existingPaths = [];
let writtenPaths = {};
const omegaLibMock = {
  makePathIfNeeded(rootFolder) {
    existingPaths.push(fixPath(rootFolder));
  }
}

const fsMock = {
  copyFileSync(fullPath, bakPath) {
    copyPaths.push({
      fullPath:fixPath(fullPath),
      bakPath:fixPath(bakPath)
    });
  },
  existsSync(fullPath) {
    return existingPaths.includes(fixPath(fullPath));
  },
  writeFileSync(fullPath, content) {
    writtenPaths[fixPath(fullPath)] = content;
  }
};

const mocks = {
  '@imat/omegalib': omegaLibMock,
  'fs': fsMock
};
const api = proxyquire('./api', mocks);

describe('api tests', () => {
  beforeEach(() => {
    copyPaths = [];
    existingPaths = [];
    writtenPaths = {};
  });

  it('should init', () => {
    expect(api).to.be.a('function');
  });

  it('should work with one api files', (done) => {
    api(['dogs']).then(val => {
      expect(val).to.equal(undefined);
      expect(copyPaths.length).to.equal(0);
      expect(existingPaths.length).to.equal(1, 'existingPath');
      expect(existingPaths[0]).to.equal('src/api', 'existingPath');
      expect(Object.keys(writtenPaths).length).to.equal(2, 'writtenPath');
      expect(Object.keys(writtenPaths)[0]).to.equal('src/api/dogs.js', 'writtenPath');
      expect(Object.keys(writtenPaths)[1]).to.equal('src/api/dogs.mocha.js', 'writtenPath');
      done();
    }).catch(ex => {
      done(ex);
    });
  });

  it('should work with multiple api files', (done) => {
    existingPaths.push('src/api/animals/dogs.js');
    existingPaths.push('src/api/animals/dogs.mocha.js');
    const expectedCopyPath = [{
      fullPath:'src/api/animals/dogs.js',
      bakPath: 'src/api/animals/dogs.js.bak'
    },{
      fullPath:'src/api/animals/dogs.mocha.js',
      bakPath: 'src/api/animals/dogs.mocha.js.bak'
    }];

    api(['--taco', 'animals/dogs','animals/dogs/(dogid)','animals/dogs/(dogid)/bark']).then(val => {
      expect(val).to.equal(undefined);

      expect(copyPaths.length).to.equal(2);
      expect(copyPaths).to.eql(expectedCopyPath, 'copyPaths');

      expect(existingPaths.length).to.equal(5, 'existingPaths length is invalid');
      expect(existingPaths[0]).to.equal('src/api/animals/dogs.js', 'existingPaths[0] is invalid');
      expect(existingPaths[1]).to.equal('src/api/animals/dogs.mocha.js', 'existingPaths[1] is invalid');
      expect(existingPaths[2]).to.equal('src/api/animals', 'existingPaths[2] is invalid');
      expect(existingPaths[3]).to.equal('src/api/animals/dogs', 'existingPaths[3] is invalid');
      expect(existingPaths[4]).to.equal('src/api/animals/dogs/(dogid)', 'existingPaths[4] is invalid');

      expect(Object.keys(writtenPaths).length).to.equal(6, 'writtenPaths length is invalid');
      expect(Object.keys(writtenPaths)[0]).to.equal('src/api/animals/dogs.js', 'writtenPaths[0] is invalid');
      expect(Object.keys(writtenPaths)[1]).to.equal('src/api/animals/dogs.mocha.js', 'writtenPaths[1] is invalid');
      expect(Object.keys(writtenPaths)[2]).to.equal('src/api/animals/dogs/(dogid).js', 'writtenPaths[2] is invalid');
      expect(Object.keys(writtenPaths)[3]).to.equal('src/api/animals/dogs/(dogid).mocha.js', 'writtenPaths[3] is invalid');
      expect(Object.keys(writtenPaths)[4]).to.equal('src/api/animals/dogs/(dogid)/bark.js', 'writtenPaths[4] is invalid');
      expect(Object.keys(writtenPaths)[5]).to.equal('src/api/animals/dogs/(dogid)/bark.mocha.js', 'writtenPaths[5] is invalid');

      done();
    }).catch(ex => {
      done(ex);
    });
  });

  it('should fail with no files', (done) => {
    api([]).then(() => {
      done('Should have rejected.');
    }).catch(ex => {
      expect(ex.message).to.equal('1');
      done();
    });
  });

  it('should fail with bad filename', (done) => {
    api(['dogs.js']).then(() => {
      done('Should have rejected.');
    }).catch(ex => {
      expect(ex.message).to.equal('2');
      done();
    });
  });
});
