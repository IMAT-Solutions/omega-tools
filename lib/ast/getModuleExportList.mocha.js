/* eslint-env mocha */
const expect = require('chai').expect;
const getModuleExportList = require('./getModuleExportList');

describe('getModuleExportList tests', () => {
  it('should init', () => {
    expect(getModuleExportList).to.be.a('function');
  });

  it('should process proper format in first pos', () => {
    const body = [
      {
        type: 'ExpressionStatement',
        expression: {
          operator: '=',
          left: {
            object: { name: 'apimodule' },
            property: { name: 'exports' }
          },
          right: {
            type: 'ObjectExpression',
            properties: [
              {
                key: { name: 'getList' },
                value: { name: 'getList' }
              },
              {
                key: { name: 'getItem' },
                value: { name: 'getSingleItem' }
              },
              {
                key: { name: 'putItem' },
                value: { name: 'putItemFn' }
              },
              {
                key: { name: 'postItem' },
                value: {}
              }
            ]
          }
        }
      }
    ]
    const expected = [
      { 'fnName': 'getList', 'key': 'getList' },
      { 'fnName': 'getSingleItem', 'key': 'getItem' },
      { 'fnName': 'putItemFn', 'key': 'putItem' },
      { 'fnName': 'postItem', 'key': 'postItem' }
    ];
    const ret = getModuleExportList(body);
    expect(ret).to.eql(expected);
  });

  it('should process proper format not in first pos', () => {
    const body = [
      {
        type: 'invalid'
      },
      {
        type: 'ExpressionStatement',
        expression: {
          operator: '=',
          left: {
            object: { name: 'tacos' },
            property: { name: 'fish' }
          },
          right: {}
        }
      },
      {
        type: 'ExpressionStatement',
        expression: {
          operator: '=',
          left: {
            object: { name: 'apimodule' },
            property: { name: 'exports' }
          },
          right: {
            type: 'ObjectExpression',
            properties: [
              {
                key: { name: 'getList' },
                value: { name: 'getList' }
              }
            ]
          }
        }
      }
    ]
    const expected = [
      { 'fnName': 'getList', 'key': 'getList' }
    ];
    const ret = getModuleExportList(body);
    expect(ret).to.eql(expected);
  });

  it('should process invalid right side', () => {
    const body = [
      {
        type: 'ExpressionStatement',
        expression: {
          operator: '=',
          left: {
            object: { name: 'apimodule' },
            property: { name: 'exports' }
          },
          right: {}
        }
      }
    ]
    const expected = [];
    const ret = getModuleExportList(body);
    expect(ret).to.eql(expected);
  });
});
