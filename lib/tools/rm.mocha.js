/* eslint-env mocha */
const path = require('path');
const expect = require('chai').expect;
const proxyquire = require('proxyquire');

let rootPaths = [];
const omegaLibMock = {
  deleteFolderRecursive(rootFolder) {
    rootPaths.push(rootFolder);
  }
}

const mocks = {
  '@imat/omegalib': omegaLibMock
};
const rm = proxyquire('./rm', mocks);

describe('rm tests', () => {
  beforeEach(() => {
    rootPaths = [];
  });

  it('should init', () => {
    expect(rm).to.be.a('function');
  });

  it('should work with one path', (done) => {
    rm(['dogs']).then(val => {
      var expectedPath = path.join(process.cwd(), 'dogs');
      expect(val).to.equal(undefined);
      expect(rootPaths.length).to.equal(1);
      expect(rootPaths[0]).to.equal(expectedPath);
      done();
    }).catch(ex => {
      done(ex);
    });
  });

  it('should work with several path', (done) => {
    rm(['animals/dogs','foods/desserts/cheesecake','blanks']).then(val => {
      var expectedPaths = [
        path.join(process.cwd(), 'animals/dogs'),
        path.join(process.cwd(), 'foods/desserts/cheesecake'),
        path.join(process.cwd(), 'blanks')
      ]
      expect(val).to.equal(undefined);
      expect(rootPaths.length).to.equal(3);
      expect(rootPaths).to.eql(expectedPaths);
      done();
    }).catch(ex => {
      done(ex);
    });
  });

  it('should work with no paths', (done) => {
    rm([]).then(() => {
      done('Should have rejected promise.');
    }).catch(() => {
      expect(rootPaths.length).to.equal(0);
      done();
    });
  });
});
