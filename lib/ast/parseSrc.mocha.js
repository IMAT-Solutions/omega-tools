/* eslint-env mocha */
const expect = require('chai').expect;
const parseSrc = require('./parseSrc');

describe('parseSrc tests', () => {
  it('should init', () => {
    expect(parseSrc).to.be.a('function');
  });

  it('should process simple src', () => {
    const src = 'var a = 10;';
    const expected = [
      {
        declarations: [
          {
            end: 10,
            id: {
              end: 5,
              name: 'a',
              start: 4,
              type: 'Identifier'
            },
            init: {
              end: 10,
              raw: '10',
              start: 8,
              type: 'Literal',
              value: 10
            },
            start: 4,
            type: 'VariableDeclarator'
          }
        ],
        end: 11,
        kind: 'var',
        start: 0,
        type: 'VariableDeclaration'
      }
    ];
    const ret = parseSrc(src);
    expect(ret).to.eql(expected);
  });

  it('should handle error', () => {
    const src = 'var a = 10;\nblah))';
    let log = console.log;
    let consoleResp = '';
    console.log = (info) => {
      consoleResp += (info+'\n');
    };
    const expected = '\x1b[93mUnexpected token (2:4)\x1b[0m\n1: \u001b[32mvar a = 10;\u001b[0m\n2: \u001b[31mblah))\u001b[0m\n   ----^\n';
    const ret = parseSrc(src);
    console.log = log;
    expect(ret).to.equal(undefined);
    expect(consoleResp).to.equal(expected);
  });
});
