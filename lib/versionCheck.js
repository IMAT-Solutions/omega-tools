const fs = require('fs');
const { loadJsonFile } = require('@imat/omegalib');
const path = require('path');
const psRoot = path.join(process.cwd(),'/node_modules/@imat');


function versionCheck() {
  const appPackage = loadJsonFile('./package.json');
  try {
    if (fs.existsSync(psRoot)) {
      const psDependencies = fs.readdirSync(psRoot).map(name => path.join(psRoot, name));
      for(let i=0; i < psDependencies.length; i++) {
        let packJson, appVersion;
        try {
          packJson = loadJsonFile(psDependencies[i] + '/package.json');
          appVersion = appPackage.dependencies[packJson.name] ? appPackage.dependencies[packJson.name].split('#v')[1] : appPackage.devDependencies[packJson.name].split('#v')[1];
        } catch (err) {
          return false;
        }
        const appVersionDigits = appVersion.split('.');
        const packJsonDigits = packJson.version.split('.');
        if (parseInt(packJsonDigits[0],10) < parseInt(appVersionDigits[0],10) || parseInt(packJsonDigits[1],10) < parseInt(appVersionDigits[1],10)) {
          console.error('\x1b[41m','*** Omega modules out of date or missing ***','\x1b[0m');
          console.error('\x1b[41m','*** You need to update or install Omega, Omega-Tools, and Omega-Lib ***','\x1b[0m');
          return false;
        }
      }
    }
  } catch(err) {
    return true;
  }
  return true;
}

module.exports = versionCheck;