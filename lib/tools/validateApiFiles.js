const validateApiFiles = require('../validateApiFiles');

function validate(argv) {
  console.log('\x1b[96mValidating API files\x1b[0m');

  return new Promise(
    (resolve, reject) => {
      const failed = validateApiFiles(...argv)

      console.log('\n');

      if (failed) {
        reject(new Error(1));
      }

      resolve();
    }
  );
}

module.exports = validate;
