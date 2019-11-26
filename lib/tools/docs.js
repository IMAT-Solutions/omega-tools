const fs = require('fs');
const path = require('path').posix;
const {readDeepDirs, makePathIfNeeded} = require('@imat/omegalib');
const DOC_BLOCKS_RE = /\/\*\*\s*\n\s*\*?\s*((?:.|\s)+?)\*\//g;
const PROPERTY_RE = /(\n\s*\*?[ ]?)@/g;
const PROP_NAME_RE = /^@api([a-z]*)\s+([\s\S]*)$/i;
const INLINE_RE = /(\n\s*\*[ ]?)/g;
const OPTIONAL_FIELD_RE = /^\[([^\]]+)\]$/;
const API_DEFINE_GROUP = '@apiDefineGroup';
const APP_JSON = 'application/json';
const LINE_WITHOUT_NAME = /^\s*(<(?<tag>[^>]+)>)?\s*(\((?<paren>[^>]+)\))?\s*(?:{(?<curly>[^}]+)})?\s*(-?\s*(?<description>.*))$/;
const LINE_WITH_NAME = /^\s*(<(?<tag>[^>]+)>)?\s*(\((?<paren>[^>]+)\))?\s*(?:{(?<curly>[^}]+)})?\s*(?<name>[\S\[\]=]+)\s*(-?\s*(?<description>.*))$/;
const LINE_JUST_DESC = /^\s*-?\s*(?<description>[.\s\S]*)$/;
const NAME_LINE = 'LINE';
const PARAM_ORDER = ['path', 'query', 'header', 'cookie', 'body'];
const ENDPOINT_ORDER = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const VALID_EXTS = ['.js', '.api'];

//********************************************
// Entrypoint for the document generator code
//********************************************
function createDocs(argv) {
  let output = {};
  const srcFolder = argv[0] || 'src/api';
  const dstFolder = argv[1] || 'dist/api';
  const dstFile = path.join(dstFolder, 'apidocs.json');

  //Just return if src/api doesn't exist
  if (!fs.existsSync(srcFolder)) {
    return Promise.resolve();
  }

  // Read all files in the src folder and its sub folders
  const allFiles = readDeepDirs(srcFolder, {includeSrcPath:true,prependSlash:false});
  console.log(`\n\n\x1b[96mGenerating API Documentation from \x1b[93m${allFiles.length}\x1b[96m files.\x1b[0m\n`);

  allFiles.forEach(srcFile => {
    // Process one file
    const ext = path.extname(srcFile);
    if (VALID_EXTS.includes(ext)) {
      const newVals = process(srcFile);

      // Append the results of each file into the output
      Object.entries(newVals).forEach(
        ([group, data]) => {
          output[group] = output[group] || {
            description: '',
            url: '',
            params: [],
            endpoints: []
          };

          // `.description`, `.url` and `.params` all come from the `@apiDefineGroup` sections
          // TODO: MGC-2019-03-27 Should we throw an error is there are two `@apiDefineGroup` sections for the same group?
          output[group].description += data.description; // Append the descriptions
          output[group].url = output[group].url || data.url; // Only one `url` can be used per `@apiDefineGroup`
          output[group].params = [...output[group].params, ...data.params].sort(sortParams); // Append the params

          // `.endponts` come from the `@api` sections
          output[group].endpoints = [...output[group].endpoints, ...data.endpoints].sort(sortEndpoints);
        }
      );
    }
  });

  const cnt = Object.keys(output).length; // Number of groups
  console.log(`Found \x1b[93m${cnt}\x1b[0m groups of APIs`);

  // All `Omega` tools must return a promise
  return new Promise(
    (resolve, reject) => {
      console.log(`Saving file as \x1b[93m${dstFile}\x1b[0m`);
      // Save the output
      makePathIfNeeded(path.dirname(dstFile));
      fs.writeFile(dstFile, JSON.stringify(output), (err) => {
        if (err) {
          reject(err);
        }

        resolve();
      });
    }
  );
}

// Sort a group of `@apiParam` values
function sortParams(a, b) {
  let ret = PARAM_ORDER.indexOf(a.type) - PARAM_ORDER.indexOf(b.type);
  if (ret === 0) {
    ret = a.field < b.field ? -1 : a.field === b.field ? 0 : 1;
  }

  return ret;
}

// Sort a group of `@api` sections
function sortEndpoints(a, b) {
  let ret = a.src < b.src ? -1 : a.src === b.src ? 0 : 1;
  if (ret === 0) {
    ret = ENDPOINT_ORDER.indexOf(a.method) - ENDPOINT_ORDER.indexOf(b.method);
  }

  return ret;
}

function process(fname) {
  try {
    const content = fs.readFileSync(fname, 'utf8').replace(/\r\n/g, '\n');
    const blocks = getBlocks(content);
    return processBlocks(blocks, fname);
  }

  catch(ex) {
    console.error(ex.stack);
  }
}

function getBlocks(src) {
  const blocks = [];

  // Find first block in file
  let matches = DOC_BLOCKS_RE.exec(src);

  while (matches) {
    const block = matches[1]
      .replace(PROPERTY_RE, '\uFFFF@')
      .replace(INLINE_RE, '\n')
      .split('\uFFFF');
    blocks.push(block);

    // Find next
    matches = DOC_BLOCKS_RE.exec(src);
  }

  return blocks;
}

function processOneBlock(block, fname) {
  var res = {
    src: fname,
    method: '',
    url: '',
    title: '',
    description: '',
    permissions: {type: 'none'},
    params: [],
    examples: {}
  };

  block.forEach(
    line => { //eslint-disable-line complexity
      const temp = line.match(PROP_NAME_RE);
      if (temp) {
        let param = temp[1].toLowerCase() || 'api';
        const detail = temp[2];

        if (param === 'definegroup') {
          const vals = processSection(detail, NAME_LINE);
          res.method = true;
          res.url = vals.name;
          res.group = vals.paren;
          res.description = vals.description;
        }
        else if (param === 'api') {
          const {method, url, title} = parseApi(detail);

          if (res.method) {
            throw new SyntaxError(`You can not define @api twice in one block for @api {${res.method}} ${res.url}.`);
          }

          res.method = method;
          res.url = url;
          res.title = title;
        }
        else if (param === 'param') {
          res.params.push(parseParam(detail));
        }
        else if (param === 'permissions') {
          const permissions = processSection(detail, false);
          res.permissions.type = permissions.paren;
          if (res.permissions.type === 'role') {
            res.permissions.permissions = permissions.description;
          }
          else if (res.permissions.type !== 'user' && res.permissions.type !== 'none') {
            throw new SyntaxError(`The parenthesis value for @apiPermissions must be (none), (user) or (role).`);
          }
        }
        else if (param === 'requestvalue') {
          const rv = parseParam(detail);
          const status = rv.status;
          if (!status) {
            throw new Error(`${res.title}: You must supply a status for Request Values.`);
          }
          res.examples[status] = res.examples[status] || {};
          res.examples[status].requestValues = res.examples[status].requestValues || {};
          res.examples[status].requestValues[rv.type] = res.examples[status].requestValues[rv.type] || {};
          res.examples[status].requestValues[rv.type][rv.field] = rv.description;
        }
        else if (param === 'responsevalue') {
          const rv = parseParam(detail);
          const status = rv.status;
          if (!status) {
            throw new Error(`${res.title}: You must supply a status for Response Values.`);
          }
          res.examples[status] = res.examples[status] || {};
          res.examples[status].responseValues = res.examples[status].responseValues || {};
          res.examples[status].responseValues[rv.type] = res.examples[status].responseValues[rv.type] || {};
          res.examples[status].responseValues[rv.type][rv.field] = rv.description;
        }
        else if (param === 'requestexample') {
          const example = processExample(detail);
          const status = example.status;
          if (!status) {
            throw new Error(`${res.title}: You must supply a status for all examples.`);
          }
          res.examples[status] = res.examples[status] || {};
          res.examples[status].request = example;
        }
        else if (param === 'responseexample') {
          const example = processExample(detail);
          const status = example.status;
          if (!status) {
            throw new Error(`${res.title}: You must supply a status for all examples.`);
          }
          res.examples[status] = res.examples[status] || {};
          res.examples[status].response = example;
        }
        else {
          const match = detail.match(LINE_JUST_DESC);
          res[param] = ((match ? match.groups.description : detail)||'').trim();
        }
      }
    }
  );

//  res.block = block;
  if (!res.method || !res.url) {
    return null;
  }
  return res;
}

function processBlocks(blocks, fname) {
  return blocks.reduce(
    (acc, block) => {
      const temp = processOneBlock(block, fname);
      if (temp) {
        const group = temp.group || 'General';

        acc[group] = acc[group] || {
          description: '',
          url: '',
          params: [],
          endpoints: []
        };

        if (block[0].startsWith(API_DEFINE_GROUP)) {
          acc[group].description = temp.description || acc[group].description;
          acc[group].url = temp.url || acc[group].url;
          acc[group].params = (temp.params || acc[group].params).sort(sortParams);
        }
        else {
          delete temp.group;
          temp.params = temp.params.sort(sortParams);
          acc[group].endpoints.push(temp);
        }
      }

      return acc;
    }, {}
  );
}

function parseApi(detail) {
  const temp = processSection(detail);
  return {
    method: temp.curly.toUpperCase(),
    url: temp.name,
    title: temp.description
  };
}

function parseParam(detail) {
  const temp = processSection(detail);
  let field = temp.name;
  let optional = field.match(OPTIONAL_FIELD_RE);
  let defaultVal = '';

  if (optional) {
    field = optional[1];
    optional = true;
  }
  else {
    optional = false;
  }

  if (field.includes('=')) {
    let parts = field.split('=');
    field = parts[0].trim();
    defaultVal = parts[1].trim();
  }

  return {
    type: (temp.paren || 'body').toLowerCase(),
    field,
    constraint: temp.curly || 'string',
    description: temp.description.trim(),
    default: defaultVal,
    status: temp.tag || '',
    optional
  };
}

function processExample(detail) {
  const temp = processSection(detail, NAME_LINE);
  return {
    format: temp.paren || APP_JSON,
    type: temp.curly || 'object',
    status: temp.tag || '',
    title: temp.name,
    example: temp.description
  };
}

function processSection(detail, hasName = true) { // eslint-disable-line complexity
  const res = {
    curly: '',
    paren: '',
    tag: '',
    name: '',
    description: ''
  };

  const re = hasName===true ? LINE_WITH_NAME : LINE_WITHOUT_NAME;
  const temp = detail.split('\n');
  const description = temp.slice(1).join('\n');
  const match = temp[0].match(re);
  if (match) {
    res.paren = (match.groups.paren||'');
    res.curly = match.groups.curly||'';
    res.tag = match.groups.tag||'';
    if (hasName === NAME_LINE) {
      res.name = match.groups.description||'';
      res.description = '';
    }
    else {
      res.name = match.groups.name||'';
      res.description = match.groups.description||'';
    }
    if (res.description.length > 0 && description) {
      res.description += '\n';
    }

    res.description += description;
  }

  return res;
}

module.exports = createDocs;

/*
[✓] Read Entire Folder
[ ] Handle Markdown
[✓] @api
[ ] @apiDefine
[✓] @apiDefineGroup
[✓] @apiDescription
[✓] @apiGroup
[✓] @apiParam - (header, body, query, path, cookie)
[✓] @apiPermission
[✓] @apiRequestExample
[✓] @apiRequestParam
[✓] @apiResponseExample
[✓] @apiResponseParam

[-] @apiDeprecated
[-] @apiError
[-] @apiErrorExample
[-] @apiExample
[-] @apiHeaderExample
[-] @apiIgnore - A block with @apiIgnore will not be parsed.
[-] @apiName
[-] @apiParamExample
[-] @apiPrivate
[-] @apiSampleRequest
[-] @apiSuccess
[-] @apiSuccessExample
[-] @apiUse
[-] @apiVersion
*/
