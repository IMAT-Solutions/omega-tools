/* eslint-env mocha */
const expect = require('chai').expect;
const proxyquire = require('proxyquire');
let logList = [];
let fileList = {};
let realConsoleLog;
const consoleLogStub = (...args) => logList.push(args);
const getFileArrayFromGlobStub = (cwd, globList) => Object.keys(fileList); // eslint-disable-line no-unused-vars
const fsStubs = {
  readFileSync(fname) {
    return fileList[fname];
  }
}

const stubs = {
  'fs': fsStubs,
  '@imat/omegalib': {getFileArrayFromGlobStub}
};
const validateApiFiles = proxyquire('./validateApiFiles', stubs);

function callValidateApiFiles(...args) {
  console.log = consoleLogStub;
  validateApiFiles(...args);
  console.log = realConsoleLog;
}

describe('validateApiFiles tests', () => {
  beforeEach(() => {
    fileList = {};
    logList = [];
  });

  after(() => {
  });

  before(() => {
    realConsoleLog = console.log;
  });

  it('should init', () => {
    expect(validateApiFiles).to.be.a('function');
  });

  it('should do nothing with a blank list', () => {
    callValidateApiFiles();
    expect(logList.length).to.equal(1);
    expect(logList[0][1]).to.equal('\x1b[96mRuntime\x1b[0m');
  });
  //
  // describe('Test a single file', () => {
  //   it('should handle no exports', () => {
  //     fileList.tacos = `module.exports = {};`
  //     callValidateApiFiles();
  //     expect(logList[0]).to.eql(['\u001b[92mValidating the API file:\u001b[0m','tacos']);
  //     expect(logList[1]).to.eql(['\u001b[31m* \u001b[91m\'module.exports\'\u001b[31m must exist as an object with one or more valid function.\u001b[0m\n  https://github.com/IMAT-Solutions/omega/blob/master/docs/lib/api.md#exporteds']);
  //   });
  //
  //   it('should handle bad exports', () => {
  //     fileList.tacos = `module.exports = 10;`
  //     callValidateApiFiles();
  //     expect(logList[0]).to.eql(['\u001b[92mValidating the API file:\u001b[0m','tacos']);
  //     expect(logList[1]).to.eql(['\u001b[31m* \u001b[91m\'module.exports\'\u001b[31m must exist as an object with one or more valid function.\u001b[0m\n  https://github.com/IMAT-Solutions/omega/blob/master/docs/lib/api.md#exporteds']);
  //   });
  //
  //   it('should handle exporting no valid function', () => {
  //     fileList.tacos = `function dog() {};
  //     module.exports = {dog};`
  //     callValidateApiFiles();
  //     expect(logList[0]).to.eql(['\u001b[92mValidating the API file:\u001b[0m','tacos']);
  //     expect(logList[1]).to.eql(['\u001b[31m* Invalid exported function named \u001b[91m\'dog\'\u001b[31m\u001b[0m\n  https://github.com/IMAT-Solutions/omega/blob/master/docs/lib/api.md#exported-functions']);
  //   });
  //
  //   it('should handle exporting valid function', () => {
  //     fileList.tacos = `function getList({params, headers}) {};
  //     module.exports = {getList};`
  //     callValidateApiFiles();
  //     expect(logList[1][1]).to.equal('\u001b[96mRuntime\u001b[0m');
  //   });
  //
  //   it('should handle extra IDs', () => {
  //     fileList['dogs/(aid)/eat/(bid)/frogs'] = `function getList({aid, bid, params, headers}) {};
  //     module.exports = {getList};`
  //     callValidateApiFiles();
  //     expect(logList[1][1]).to.equal('\u001b[96mRuntime\u001b[0m');
  //   });
  //
  //   it('should handle extra IDs invalid function signature', () => {
  //     fileList['dogs/(aid)/eat/(bid)/frogs'] = `function getList({id1, id2, params, headers}) {};
  //     module.exports = {getList};`
  //     callValidateApiFiles();
  //     expect(logList[1][0]).to.equal('\u001b[31m* The expected function signature for \u001b[91m\'getList({aid, bid, params, headers})\'\u001b[31m was written incorrectly\u001b[0m\n  https://github.com/IMAT-Solutions/omega/blob/master/docs/lib/api.md#api-functions');
  //   });
  //
  //   it('should handle invalid IDs invalid function signature', () => {
  //     fileList['dogs/(aid)/eat/(bid)/frogs'] = `function getList(aid, bid, params, headers) {};
  //     module.exports = {getList};`
  //     callValidateApiFiles();
  //     expect(logList[1][0]).to.equal('\u001b[31m* The expected function signature for \u001b[91m\'getList({aid, bid, params, headers})\'\u001b[31m was written incorrectly\u001b[0m\n  https://github.com/IMAT-Solutions/omega/blob/master/docs/lib/api.md#api-functions');
  //   });
  //
  //   it('should handle valid arrow function', () => {
  //     fileList.tacos = `const putItem = ({id, data, params, headers}) => {};
  //     module.exports = {putItem};`
  //     callValidateApiFiles();
  //     expect(logList[1][1]).to.equal('\u001b[96mRuntime\u001b[0m');
  //   });
  //
  //   it('should error with inline arrow function', () => {
  //     fileList.tacos = `module.exports = {getItem:({id, params, headers}) => {}};`
  //     callValidateApiFiles();
  //     expect(logList[1][0]).to.equal('\u001b[31m* Exported function named \u001b[91m\'getItem\'\u001b[31m was incorrectly declared inline\u001b[0m\n  https://github.com/IMAT-Solutions/omega/blob/master/docs/lib/api.md#exported-functions');
  //   });
  //
  //   it('should error with inline function', () => {
  //     fileList.tacos = `module.exports = {postItem:function({data, params, headers}) {}};`
  //     callValidateApiFiles();
  //     expect(logList[1][0]).to.equal('\u001b[31m* Exported function named \u001b[91m\'postItem\'\u001b[31m was incorrectly declared inline\u001b[0m\n  https://github.com/IMAT-Solutions/omega/blob/master/docs/lib/api.md#exported-functions');
  //   });
  //
  //   it('should handle invalid function signature', () => {
  //     fileList.tacos = `function getItem({dog, params, headers}) {};
  //     module.exports = {getItem};`
  //     callValidateApiFiles();
  //     expect(logList[1][0]).to.equal('\u001b[31m* The expected function signature for \u001b[91m\'getItem({id, params, headers})\'\u001b[31m was written incorrectly\u001b[0m\n  https://github.com/IMAT-Solutions/omega/blob/master/docs/lib/api.md#api-functions');
  //   });
  //
  //   it('should handle invalid default value', () => {
  //     fileList.tacos = `function getItem(id = 10) {};
  //     module.exports = {getItem};`
  //     callValidateApiFiles();
  //     expect(logList[1][0]).to.equal('\u001b[31m* The expected function signature for \u001b[91m\'getItem({id, params, headers})\'\u001b[31m was written incorrectly\u001b[0m\n  https://github.com/IMAT-Solutions/omega/blob/master/docs/lib/api.md#api-functions');
  //   });
  //
  //   it('should handle invalid parameter', () => {
  //     fileList.tacos = `/* Testing invalid params */
  //     function getItem(10) {};
  //     module.exports = {getItem};`
  //     callValidateApiFiles();
  //     expect(logList[1][0]).to.equal('\u001b[93mUnexpected token (2:23)\u001b[0m');
  //   });
  //
  //   it('should handle valid parameter line 5', () => {
  //     fileList.tacos = `// Line 1
  //     // Line 2
  //     // line 3
  //     // line 4
  //     function getItem({id, params, headers}) {};
  //     module.exports = {getItem};`
  //     callValidateApiFiles();
  //     expect(logList[1][1]).to.equal('\u001b[96mRuntime\u001b[0m');
  //   });
  //
  //   it('should handle invalid parameter line 5', () => {
  //     fileList.tacos = `// Line 1
  //     // Line 2
  //     // line 3
  //     // line 4
  //     function getItem(10) {};
  //     module.exports = {getItem};`
  //     callValidateApiFiles();
  //     expect(logList[1][0]).to.equal('\u001b[93mUnexpected token (5:23)\u001b[0m');
  //   });
  //
  //   it('should handle arrow function as third var', () => {
  //     fileList.tacos = `var a = 10, b, getItem = ({id, params, headers}) => {};
  //     module.exports = {getItem};`
  //     callValidateApiFiles();
  //     expect(logList[1][1]).to.equal('\u001b[96mRuntime\u001b[0m');
  //   });
  //
  //   it('should handle undefined function', () => {
  //     fileList.tacos = `var getItem = 10;
  //     module.exports = {getItem};`
  //     callValidateApiFiles();
  //     expect(logList[1][0]).to.equal('\u001b[31m* The function \u001b[91m\'getItem\'\u001b[31m was not defined\u001b[0m');
  //   });
  //
  //   it('should handle undefined function with other functions', () => {
  //     fileList.tacos = `function dog() {};
  //     const cat = () => {};
  //     var getItem = 10;
  //     module.exports = {getItem};`
  //     callValidateApiFiles();
  //     expect(logList[1][0]).to.equal('\u001b[31m* The function \u001b[91m\'getItem\'\u001b[31m was not defined\u001b[0m');
  //   });
  // });
});
