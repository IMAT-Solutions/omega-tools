function getCode(src, line, char) {
  const lines = src.split(/\r?\n/);
  let i = line-3;
  if (i < 0) {
    i = 0;
  }
  const numLen = line.toString().length;
  const lastLine = [
    ' '.repeat(numLen+2),
    '-'.repeat(char),
    '^'
  ].join('');
  const output = [];
  for(; i < line-1; i++) {
    let temp = `${(i+1).toString().padStart(numLen, ' ')}: \x1b[32m${lines[i]}\x1b[0m`;
    output.push(temp);
  }
  output.push(`${(line).toString().padStart(numLen, ' ')}: \x1b[31m${lines[line-1]}\x1b[0m`);
  output.push(lastLine);
  return output.join('\n');
}

module.exports = getCode;
