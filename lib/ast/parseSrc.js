const acorn = require('acorn');
const getCode = require('./getCode');
const lineCharRe = /\((\d+)\:(\d+)\)/;

function parseSrc(src) {
  const options = {};
  let ast;
  try {
    ast = acorn.parse(src, options);
  }

  catch(ex) {
    const [val, line, char] = lineCharRe.exec(ex.message); // eslint-disable-line no-unused-vars
    console.log(`\x1b[93m${ex.message}\x1b[0m`);
    console.log(getCode(src, line, char));
    return;
  }

  const {body} = ast;
  return body;
}

module.exports = parseSrc;
