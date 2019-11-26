/* eslint-env mocha */
const expect = require('chai').expect;
const getCode = require('./getCode');

describe('getCode tests', () => {
  it('should init', () => {
    expect(getCode).to.be.a('function');
  });

  it('should work on line 1', () => {
    const ret = getCode(`This is a test\nThis is line 2`, 1, 8);
    expect(ret).to.equal('1: \u001b[31mThis is a test\u001b[0m\n   --------^');
  });

  it('should work on line 5', () => {
    const ret = getCode(`Line 1\nline 2\nLine 3\nLine 4\nThis is a test\nThis is line 6`, 5, 10);
    expect(ret).to.equal('3: \u001b[32mLine 3\u001b[0m\n4: \u001b[32mLine 4\u001b[0m\n5: \u001b[31mThis is a test\u001b[0m\n   ----------^');
  });
});
