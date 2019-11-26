/* eslint-env mocha */
const expect = require('chai').expect;
const getIdsFromPath = require('./getIdsFromPath');

describe('getIdsFromPath tests', () => {
  it('should init', () => {
    expect(getIdsFromPath).to.be.a('function');
  });

  it('should work with no id', () => {
    const ret = getIdsFromPath('api/user/login');
    expect(ret).to.eql([]);
  });

  it('should work with one id', () => {
    const ret = getIdsFromPath('api/user/(uid)/call');
    expect(ret).to.eql(['uid']);
  });

  it('should work with multiple ids', () => {
    const ret = getIdsFromPath('/api/dog/(one)/(two)/bark/(three)');
    expect(ret).to.eql(['one','two','three']);
  });
});
