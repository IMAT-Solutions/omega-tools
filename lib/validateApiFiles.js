// const acorn = require('acorn');
// const fs = require('fs');
// const { getFileArrayFromGlob } = require('@imat/omegalib');
// const idsRe = /\/\(([^)]+)\)\//gm;
// const SIGNATURE = 'SIGNATURE';
// const requiredParamList = {
//   'getList': ['params','headers'],
//   'getItem': ['id','params','headers'],
//   'postItem': ['data','params','headers'],
//   'putItem': ['id','data','params','headers'],
//   'deleteItem': ['id','params','headers'],
//   'patchItem': ['id','data','params','headers']
// }
// const lineCharRe = /\((\d+)\:(\d+)\)/;
// let errorList = [];
// const addError = (err, url) => errorList.push({err, url});
// const validFunctionNames = Object.keys(requiredParamList);
// const validFuncExps = ['ArrowFunctionExpression', 'FunctionExpression'];
// let hasErrors = false;
//
// function getParams(paramList) {
//   var fnParams = false;
//   if (Array.isArray(paramList)) {
//     if (paramList.length === 0) {
//       fnParams = [];
//     }
//     else if (paramList.length === 1 && paramList[0].type === 'ObjectPattern') {
//       fnParams = paramList[0].properties.map(objProp => objProp.key.name);
//     }
//     else {
//       throw new Error(SIGNATURE);
//     }
//   }
//
//   return fnParams;
// }
//
// function getCode(src, line, char) {
//   const lines = src.split(/\r?\n/);
//   let i = line-3;
//   if (i < 0) {
//     i = 0;
//   }
//   const numLen = line.toString().length;
//   const lastLine = [
//     ' '.repeat(numLen+2),
//     '-'.repeat(char),
//     '^'
//   ].join('');
//   const output = [];
//   for(; i < line-1; i++) {
//     let temp = `${(i+1).toString().padStart(numLen, ' ')}: \x1b[32m${lines[i]}\x1b[0m`;
//       output.push(temp);
//     }
//     output.push(`${(line).toString().padStart(numLen, ' ')}: \x1b[31m${lines[line-1]}\x1b[0m`);
//       output.push(lastLine);
//       return output.join('\n');
//     }
//
// function getFuncParams(body, fnName, inlineParams) {
//   let params = inlineParams;
//   if (!params) {
//     body.some(item => {
//       if (item.type === 'FunctionDeclaration') {
//         if (item.id.name === fnName) {
//           params = getParams(item.params);
//           return true;
//         }
//       }
//       else if (item.type === 'VariableDeclaration') {
//         return item.declarations.some(
//           dec => {
//             if (dec.init && validFuncExps.includes(dec.init.type) && dec.id.name === fnName) {
//               params = getParams(dec.init.params);
//               return true;
//             }
//           }
//         );
//       }
//     });
//   }
//
//   return params;
// }
//
// function getModuleExportList(body) {
//   var exportedList = [];
//   body.some(item => {
//     if (item.type === 'ExpressionStatement' && item.expression.operator === '=') {
//       var left = item.expression.left;
//       if (left.object.name === 'module' && left.property.name === 'exports') {
//         var right = item.expression.right;
//         if (right.type === 'ObjectExpression') {
//           exportedList = right.properties.map(prop => {
//             if (prop.value.params) {
//               addError(`Exported function named '${prop.key.name}' was incorrectly declared inline`,'https://github.com/IMAT-Solutions/omega/blob/master/docs/lib/api.md#exported-functions');
//             }
//
//             return {
//               key: prop.key.name,
//               fnName: prop.value.name || prop.key.name
//             }
//           });
//
//         }
//
//         return true;
//       }
//     }
//   });
//
//   if (exportedList.length === 0) {
//     addError(`'module.exports' must exist as an object with one or more valid function.`,'https://github.com/IMAT-Solutions/omega/blob/master/docs/lib/api.md#exporteds');
//   }
//
//   exportedList.forEach(
//     info => {
//       if (!validFunctionNames.includes(info.key)) {
//         addError(`Invalid exported function named '${info.key}'`,'https://github.com/IMAT-Solutions/omega/blob/master/docs/lib/api.md#exported-functions');
//       }
//     }
//   );
//
//   return exportedList;
// }
//
// function outputErrors() {
//   if (errorList.length > 0) {
//     hasErrors = true;
//     errorList.forEach(error => console.log(`\x1b[31m* ${error.err.replace(/('[^']+')/g, `\x1b[91m$1\x1b[31m` )}\x1b[0m${error.url?'\n  '+error.url:''}`));
//       console.log('\n');
//   }
// }
//
// // Get a list of needed extra ID values
// // `fname` will be something like `api/users/(uid)/spouses.js`
// function getIdsFromPath(fname) {
//   const ids = [];
//   while(true) { // eslint-disable-line no-constant-condition
//     let val = idsRe.exec(fname);
//     if (val === null) {
//       break;
//     }
//
//     ids.push(val[1]);
//   }
//
//   return ids;
// }
//
// function parseSrc(src) {
//   const options = {};
//   let ast;
//   try {
//     ast = acorn.parse(src, options);
//   }
//
//   catch(ex) {
//     const [val, line, char] = lineCharRe.exec(ex.message); // eslint-disable-line no-unused-vars
//     console.log(`\x1b[93m${ex.message}\x1b[0m`);
//     console.log(getCode(src, line, char));
//     return;
//   }
//
//   const {body} = ast;
//   return body;
// }
//
// function processFile(fname) {
//   console.log('\x1b[92mValidating the API file:\x1b[0m', fname);
//   errorList = [];
//   const src = fs.readFileSync(fname);
//   const extraIds = getIdsFromPath(fname);
//   const body = parseSrc(src);
//
//   if (body) {
//     getModuleExportList(body).forEach(
//       item => {
//         const requiredParams = requiredParamList[item.key];
//         if (requiredParams) {
//           let failed = false;
//           let params;
//           const reqParams = (extraIds).concat(requiredParams);
//           try {
//             params = getFuncParams(body, item.fnName, item.params);
//             if (!params) {
//               addError(`The function '${item.fnName}' was not defined`);
//               return;
//             }
//
//             failed = (reqParams.length !== params.length) ||
//                       reqParams.some((reqParam, i) => params[i] !== reqParam);
//           }
//
//           catch(ex) {
//             //console.info(ex.stack);
//             failed = true;
//           }
//
//           if (failed) {
//             const reqSignature = `${item.fnName}({${reqParams.join(', ')}})`;
//             addError(`The expected function signature for '${reqSignature}' was written incorrectly`,'https://github.com/IMAT-Solutions/omega/blob/master/docs/lib/api.md#api-functions');
//           }
//         }
//       }
//     );
//   }
//
//   outputErrors();
// }

function validateApiFiles(/*files*/) {
  console.time('\x1b[96mRuntime\x1b[0m');
  // const filesToTest = getFileArrayFromGlob(process.cwd(), files || 'api/**/!(*.mocha).js');
  // filesToTest.forEach(processFile);
  console.timeEnd('\x1b[96mRuntime\x1b[0m');
  // return hasErrors;
}

module.exports = validateApiFiles;
