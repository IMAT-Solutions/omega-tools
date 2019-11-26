/* eslint-env mocha */
const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const oneEP = `/**
 * @api {get} /api/dogs This is a comment
 * And it is on
 * 3 lines.
 * @apiGroup Main
 * @apiDescription This is a
 * multi-line
 * description field.
 * @apiPermissions (none)
 * @apiParam (header) x-mine Some header parameter.
 * @apiParam (query) {number} [ids=10] A list of ids to filter on.
 * @apiParam (header) Accept application/json.
 */
`;
const expectedOneEp = {
  Main: {
    description: '',
    url: '',
    params: [],
    endpoints: [
      {
        src: 'dogs.js',
        method: 'GET',
        url: '/api/dogs',
        title: 'This is a comment\nAnd it is on\n3 lines.',
        description: 'This is a\nmulti-line\ndescription field.',
        permissions: {
          type: 'none'
        },
        params: [
          {
            type: 'query',
            field: 'ids',
            constraint: 'number',
            description: 'A list of ids to filter on.',
            default: '10',
            status: '',
            optional: true
          },
          {
            type: 'header',
            field: 'Accept',
            constraint: 'string',
            description: 'application/json.',
            default: '',
            status: '',
            optional: false
          },
          {
            type: 'header',
            field: 'x-mine',
            constraint: 'string',
            description: 'Some header parameter.',
            default: '',
            status: '',
            optional: false
          }
        ],
        examples: {}
      }
    ]
  }
};

let mockFiles = {};
let mockOutput = null;
let errorWritingFile = false;
const omegalibMock = {
  readDeepDirs() {
    return Object.keys(mockFiles);
  }
};
const fsMock = {
  existsSync(fName) {
    return true;
  },
  readFileSync(fName) {
    return mockFiles[fName];
  },
  writeFile(fName, content, cb) {
    if (errorWritingFile) {
      cb(new Error('Error writing'));
    }
    else {
      mockOutput = content;
      cb();
    }
  }
}
const mocks = {
  'fs': fsMock,
  '@imat/omegalib': omegalibMock
};
const docs = proxyquire('./docs', mocks);

describe('docs tests', () => {
  beforeEach(() => {
    mockFiles = {};
    mockOutput = null;
    errorWritingFile = false;
  });

  it('should init', () => {
    expect(docs).to.be.a('function');
  });

  it('should work with no files', () => {
    docs([]);
    const expected = {};
    expect(mockOutput).to.equal(JSON.stringify(expected));
  });

  it('should throw error when it can not write output file', (done) => {
    errorWritingFile = true;
    docs([]).then(
      () => {
        done('Call should have thrown an error and did not')
      }
    ).catch(
      (err) => {
        expect(err.message).to.equal('Error writing');
        done();
      }
    );
  });

  it('should work with one file', () => {
    mockFiles['dogs.js'] = oneEP;
    docs([]);
    expect(mockOutput).to.equal(JSON.stringify(expectedOneEp));
  });
});
