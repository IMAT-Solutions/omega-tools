/* eslint-env mocha */
const expect = require('chai').expect;
const build = require('./build');

describe('build tests', () => {
  it('should init', () => {
    expect(build).to.be.a('function');
  });
});
