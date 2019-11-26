/* eslint-env mocha */
const expect = require('chai').expect;
const watch = require('./watch');

describe('watch tests', () => {
  it('should init', () => {
    expect(watch).to.be.a('function');
  });
});
