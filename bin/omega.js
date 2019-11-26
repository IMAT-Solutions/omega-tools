#!/usr/bin/env node

const functions = {
  api: require('../lib/tools/api'),
  docs: require('../lib/tools/docs'),
  build: require('../lib/tools/build'),
  rm: require('../lib/tools/rm'),
  validate: require('../lib/tools/validateApiFiles'),
  watch: require('../lib/tools/watch')
}

function help() {
  console.log(`
\x1b[97musage: \x1b[93mnpx omega \x1b[37m[\x1b[93m--help\x1b[37m]\x1b[0m
\x1b[97mor:    \x1b[93mnpx omega \x1b[96m<command>\x1b[93m \x1b[37m[\x1b[96m<command-args>\x1b[37m]\x1b[0m
\x1b[97mwhere \x1b[96m<command>\x1b[97m can be one of:\x1b[0m
  \x1b[93mapi\x1b[97m                  Generate the shell of an API file.\x1b[0m
  \x1b[93mbuild\x1b[97m                Build the app based on the build.config.json file.\x1b[0m
  \x1b[93mrm\x1b[97m                   Globby rm -rf <folder> [<folder2> ... <folderx>]\x1b[0m
  \x1b[93mvalidate\x1b[97m             Validate the API files in your API folder.\x1b[0m
  \x1b[93mwatch\x1b[97m                Watch the file system for changes.\x1b[0m
                       Run build as needed. Restart node as needed.
\x1b[97mand \x1b[96m<command-args>\x1b[97m are passed on to the appropriate \x1b[96m<command>\x1b[0m


\x1b[97m> \x1b[93mnpx omega api \x1b[37m[\x1b[96m<api-args>\x1b[37m] \x1b[96m<api-file-path>\x1b[0m
\x1b[97mwhere \x1b[96m<api-args>\x1b[97m can be one of:\x1b[0m
  \x1b[93m--min                \x1b[97mGenerate minimal API code without helpers\x1b[0m
\x1b[97mand \x1b[96m<api-file-path>\x1b[97m is the name of the API file to generate relative to the API folder.\x1b[0m


\x1b[97m> \x1b[93mnpx omega build \x1b[37m[\x1b[96m<build-args>\x1b[37m] [\x1b[96m<build-config-file>\x1b[37m]\x1b[0m
\x1b[97mwhere \x1b[96m<build-args>\x1b[97m can be:\x1b[0m
  \x1b[93m--noconcat           \x1b[97mDo not run the concat step of the build\x1b[0m
  \x1b[93m--verbose            \x1b[97mDisplay more detailed output\x1b[0m
  \x1b[93m--del \x1b[96m<filename>     \x1b[97mDelete file <filename> before copy step\x1b[0m


\x1b[97m> \x1b[93mnpx omega rm \x1b[96m<folder> \x1b[37m[\x1b[96m<folder>\x1b[93m ... \x1b[96m<folder>\x1b[37m]\x1b[0m
\x1b[97mwhere \x1b[96m<folder>\x1b[97m is one or more globby folder names that are to be removed.\x1b[0m


\x1b[97m> \x1b[93mnpx omega validate \x1b[37m[\x1b[96m<validate-files>\x1b[37m]\x1b[0m
\x1b[97mwhere \x1b[96m<validate-files>\x1b[97m is a globby list of filenames to validate.\x1b[0m
\x1b[37m(The default is "api/**/!(*.mocha).js")\x1b[0m


\x1b[97m> \x1b[93mnpx omega watch \x1b[37m[\x1b[96m<watch-config-file>\x1b[37m]\x1b[0m
\x1b[97mwhere \x1b[96m<watch-config-file>\x1b[97m is the path to the config file to use for watch.\x1b[0m
\x1b[37m(The default value is "./watch.config.json")\x1b[0m


`);
}

const command = process.argv[2];
if (command === undefined || command === '--help') {
  help();
}
else {
  const args = process.argv.slice(3);

  console.time('\x1b[96mRuntime\x1b[0m');

  let promise;

  //console.log('command', command, args);
  if (typeof functions[command] === 'function') {
    promise = functions[command](args);
  }
  else {
    console.error(`Unknown Omega command '${command}'`);
    promise = Promise.reject(new Error(-1));
  }

  promise.then(
    () => {
      console.timeEnd('\x1b[96mRuntime\x1b[0m');
    }
  ).catch(
    err => {
      console.error(`There was an error while running '${command}'`);
      console.error(err.stack);
      process.exit(parseInt(err.message, 10));
    }
  );
}
