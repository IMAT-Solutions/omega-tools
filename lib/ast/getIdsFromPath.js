const IDS_RE = /\/\((?<id>[^)]+)\)/g;

// Get a list of needed extra ID values
// `fname` will be something like `api/users/(uid)/spouses.js`
function getIdsFromPath(fname) {
  const ids = [];
  while(true) { // eslint-disable-line no-constant-condition
    let val = IDS_RE.exec(fname);
    if (val === null) {
      break;
    }

    ids.push(val[1]);
  }

  return ids;
}

module.exports = getIdsFromPath;
