/* eslint-env mocha */
const expect = require('chai').expect;
const proxyquire = require('proxyquire');

const validateApiFilesMock = (...argv) => {
  console.log(...argv);
  return (argv[0] === 'failed');
}

const mocks = {
  '../validateApiFiles': validateApiFilesMock
};
const validateApiFiles = proxyquire('./validateApiFiles', mocks);

describe('validateApiFiles tests', () => {
  it('should init', () => {
    expect(validateApiFiles).to.be.a('function');
  });

  it('should work without failures', (done) => {
    validateApiFiles([]).then(val => {
      expect(val).to.equal(undefined);
      done();
    }).catch(ex => {
      done(ex);
    });
  });

  it('should work with failures', (done) => {
    validateApiFiles(['failed']).then(() => {
      done('Should have throw exception');
    }).catch(ex => {
      expect(ex.message).to.equal('1');
      done();
    });
  });
});
