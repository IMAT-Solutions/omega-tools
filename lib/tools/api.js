/* eslint no-template-curly-in-string: 0 */
const fs = require('fs');
const path = require('path');
const {makePathIfNeeded} = require('@imat/omegalib');
const apiUrlPath = '/api';
const apiSrcPath = `src${apiUrlPath}`;
const idRegEx = /\(([^)]+)\)/g;

function getIds(apiPath) {
  let parts;
  const ids = [];
  do {
    parts = idRegEx.exec(apiPath);
    if (parts) {
      ids.push(parts[1]);
    }
  } while(parts !== null);
  return ids;
}

function api(argv) {
  var params = argv.reduce(
    (p, arg) => {
      if (arg.substr(0,2) === '--') {
        if (arg === '--patch') {
          p.options.addPatch = true;
        }
      }
      else {
        p.argv.push(arg);
      }

      return p;
    }, {
      argv: [],
      options: {
        addPatch: false
      }
    }
  )

  return new Promise(
    (resolve, reject) => {
      if (params.argv.length > 0) {
        let failed = params.argv.some(
          arg => {
            const apiName = path.basename(arg);
            if (apiName.includes('.')) {
              console.error('\nAPIs should not include a file extension. (No `.` allowed)');
              return true;
            }
            const apiPath = path.join(apiSrcPath, path.dirname(arg));
            const urlPath = path.join(apiUrlPath, path.dirname(arg));
            const ids = getIds(arg);
            makePathIfNeeded(apiPath);
            const apiUrl = path.join(urlPath, apiName).replace(/\\/g, '/').replace(idRegEx, ':$1');
            const fullPath = path.join(apiPath, apiName+'.js').replace(/\\/g, '/');
            const fullMochaPath = path.join(apiPath, apiName+'.mocha.js').replace(/\\/g, '/');
            const bakPath = fullPath+'.bak';
            if (fs.existsSync(fullPath)) {
              fs.copyFileSync(fullPath, bakPath);
            }
            const mochaBakPath = fullMochaPath+'.bak';
            if (fs.existsSync(fullMochaPath)) {
              fs.copyFileSync(fullMochaPath, mochaBakPath);
            }

            const template = generateTemplate(apiName, fullPath, apiUrl, ids, params.options);
            fs.writeFileSync(fullPath, template);

            const mochaTemplate = generateMochaTemplate(apiName, fullPath, ids, params.options);
            fs.writeFileSync(fullMochaPath, mochaTemplate);
          }
        );

        if (failed) {
          reject(new Error(2));
        }
        else {
          resolve();
        }
      }
      else {
        console.error('\nNo path provided.')
        reject(new Error(1));
      }
    }
  );
}

function getRequestValue(group, ids) {
  let retVal = ' * ';
  if (ids.length > 0) {
    retVal += ids.map(
      id => `@apiRequestValue <${group}> (path) ${id} FIXME Value.`
    ).join('\n * ');
  }

  return retVal;
}

function getApiParam(ids) {
  let retVal = ' * ';
  if (ids.length > 0) {
    retVal += ids.map(
      id => `@apiParam (path) ${id} FIXME Param description.`
    ).join('\n * ');
  }

  return retVal;
}

function getDocComments(method, url, title, ids) {
  let successResp = 200;
  let respExample = `\n * {
 *   FIXME RESPONSE
 * }`;
  let respValue = '';

  if (method === 'delete') {
    successResp = 204;
    respExample = '';
  }
  else if (method === 'post' || method === 'put') {
    successResp = 201;
    respExample = '';
    respValue = `\n * @apiResponseValue <201> (header) Location FIXME ${url}`;
  }

  return `/**
 * @api {${method}} ${url} ${title}
 * @apiGroup FIXME Group name
 * @apiDescription FIXME Description
 * @apiPermissions (role) FIXME 'conf-read'
${getApiParam(ids)}
${getRequestValue(successResp, ids)}
 * @apiRequestExample <${successResp}> FIXME Success Request Title${respValue}
 * @apiResponseExample <${successResp}> FIXME Success Reponse Title${respExample}
${getRequestValue(404, ids)}
 * @apiRequestExample <404> FIXME 404 Request Title
 * @apiResponseValue <404> (header) X-No-Entity FIXME ${url}
 * @apiResponseExample <404> FIXME 404 Response Title
 * {
 *   "error": true,
 *   "title": "FIXME",
 *   "status": 404,
 *   "message": "Not Found",
 *   "url": "FIXME ${url}"
 * }
 */`;
}

function generateTemplate(apiName, fullPath, apiUrl, ids, options) { // eslint-disable-line complexity
  let idsStr = ids.join(', ');
  if (idsStr) {
    idsStr += ', ';
  }

  return `/* eslint-env omega/api */
// API file: ${apiName}
// Source File: ${fullPath}
// Generated on: ${(new Date()).toLocaleString()}

//*****************************
// API Functions
//
/**
 * @apiDefineGroup (FIXME Group name) ${apiUrl}
 * FIXME: Add a description here
 * FIXME: Add any common properties here
 */

${getDocComments('get', apiUrl, `Get ${apiName}`, ids)}
function doGet({${idsStr}req}) { // eslint-disable-line no-unused-vars
  throw new HttpError(501, 'Not yet written.');
}
//doGet.auth = ['system']; // FIXME Uncomment, Delete or replace as needed
//doGet.loggedIn = true; // FIXME Uncomment, Delete or replace as needed

${getDocComments('post', apiUrl, `Save new ${apiName}`, ids)}
function doPost({${idsStr}data, req}) { // eslint-disable-line no-unused-vars
  throw new HttpError(501, 'Not yet written.');
}
//doPost.auth = ['system']; // FIXME Uncomment, Delete or replace as needed
//doPost.loggedIn = true; // FIXME Uncomment, Delete or replace as needed

${getDocComments('put', apiUrl, `Save or overwrite ${apiName}`, ids)}
function doPut({${idsStr}data, req}) { // eslint-disable-line no-unused-vars
  throw new HttpError(501, 'Not yet written.');
}
//doPut.auth = ['system']; // FIXME Uncomment, Delete or replace as needed
//doPut.loggedIn = true; // FIXME Uncomment, Delete or replace as needed

${getDocComments('delete', apiUrl, `Delete ${apiName}`, ids)}
function doDelete({${idsStr}id, req}) { // eslint-disable-line no-unused-vars
  throw new HttpError(501, 'Not yet written.');
}
//doDelete.auth = ['system']; // FIXME Uncomment, Delete or replace as needed
//doDelete.loggedIn = true; // FIXME Uncomment, Delete or replace as needed
${options.addPatch?`

${getDocComments('patch', apiUrl, `Patch ${apiName}`, ids)}
function doPatch({${idsStr}data, req}) { // eslint-disable-line no-unused-vars
  const getWithId = doGet.bind(null, {${idsStr}req});
  const putWithId = (newData) => {
    return doPut({${idsStr} data: newData, req});
  }
  return mergePatch(getWithId, putWithId, data);
}
//doPatch.auth = ['system']; // FIXME Uncomment, Delete or replace as needed
//doPatch.loggedIn = true; // FIXME Uncomment, Delete or replace as needed`:''}

apimodule.exports = {doGet, doPost, doPut, doDelete${options.addPatch?', doPatch':''}};
`;
}

function generateMochaTemplate(apiName, fullPath, ids, options) { // eslint-disable-line complexi, idsty
  let idsStr = ids.join(', ');
  if (idsStr) {
    idsStr += ', ';
  }

  return `/* eslint-env mocha */
const {expect} = require('chai');
const {test, Rest, HttpResponse, HttpError} = require('@imat/omega');
const apiquire = test.loadapi('src/api', __dirname);
const rest = new Rest.mock();

const api = apiquire('./${apiName}');

describe('Tests for API: ${fullPath}', () => {
  const req = {};
  const data = {};
  ${ids.map(id=>`let ${id} = '';`).join('\n  ')}

  beforeEach(() => {
    return rest.beforeEach();
  });

  afterEach(() => {
    return rest.afterEach();
  });

  it('should export correct data', () => {
    const exportedFunctions = ['doGet','doPost','doPut','doDelete'${options.addPatch?`,'doPatch'`:''}];
    expect(api).to.be.an('object');
    expect(Object.keys(api).length).to.equal(exportedFunctions.length);
    exportedFunctions.forEach(
      fn => {
        expect(api[fn]).to.be.a('function');
        expect(api[fn].auth).to.equal(undefined);
        expect(api[fn].loggedIn).to.equal(undefined);
      }
    );
  });

  it('should provide a response on doGet', () => {
    expect(api.doGet.bind(api, {${idsStr}req})).to.throw();
  });

  it('should provide a response on doPost', () => {
    expect(api.doPost.bind(api, {${idsStr}data, req})).to.throw();
  });

  it('should provide a response on doPut', () => {
    expect(api.doPut.bind(api, {${idsStr}data, req})).to.throw();
  });

  it('should provide a response on doDelete', () => {
    expect(api.doDelete.bind(api, {${idsStr}req})).to.throw();
  });${options.addPatch?`

  it('doPatch should be a function', () => {
    expect(api.doPatch).to.be.an('function');
  });`:''}
});
`
}


module.exports = api;
