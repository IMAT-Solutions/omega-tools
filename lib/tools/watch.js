const debug = require('debug')('Omega:tool:watch');
const fs = require('fs');
const keypress = require('keypress');
const path = require('path');
const nodewatch = require('node-watch');
const micromatch = require('micromatch');
const { spawn } = require('child_process');
const isWin = process.platform === "win32";
const NPX = isWin ? 'npx.cmd' : 'npx';
const NODE = isWin ? 'node.exe' : 'node';
const cwd = process.cwd();
const USING_NODE_WATCH = true;
let childNode;
let nodePromise;
let runInDebug = false;

function getConfig(fname) {
  let cfg = {
    root: '.',
    devBuild: false,
    nodeFiles: false
  };
  if (fs.existsSync(fname)) {
    var temp = fs.readFileSync(fname, 'utf8');
    cfg = {...cfg, ...JSON.parse(temp)};
  }

  return cfg;
}

function watch(argv) {
  let configFileName;

  if (argv[0] === '--debug') {
    runInDebug = true;
    argv.shift();
  }

  try {
    configFileName = argv[0] || 'watch.config.json';
    debug(`Reading config file: ${configFileName}`)
    const config = getConfig(configFileName);
    debug(`Config values: ${JSON.stringify(config, 0, 2)}`)
    let timeout;
    let currentChanges = {};
    const folder = path.resolve(config.root);
    const devBuild = config.devBuild;
    const nodeFiles = config.nodeFiles;

    process.chdir(folder);

    // Either use `nodewatch` or use `fs.watch`. They are mostly compatible.
    var watchfn = USING_NODE_WATCH ? nodewatch : fs.watch;

    watchfn(folder, {recursive:true},
      (eventType, absName) => {
        // `node-watch` gives back an absolute path and `fs.watch` gives a relative path
        // Create a relative path for `node-watch` & use the relative path for `fs.watch`
        const filename = USING_NODE_WATCH ? path.relative(folder, absName) : absName;

        //console.log(eventType, absName, filename);
        const exists = fs.existsSync(filename);
        let stats = null;
        if (exists) {
          stats = fs.statSync(filename);
          if (stats.isDirectory() && eventType !== 'remove') {
            // if a directory was changed then just ignore it.
            return;
          }
        }
        currentChanges[filename] = {eventType, exists, stats};
        debug(`Adding event for ${filename}: ${JSON.stringify(currentChanges[filename], 0, 2)}`)

        if (timeout) {
          // We must only call clearTimeout just before we call setTimeout
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
          var needToRestartNode = nodeFiles && micromatch(Object.keys(currentChanges), nodeFiles).length > 0;
          debug('currentChanges: '+JSON.stringify(currentChanges, 0, 2));

          spawnBuild(currentChanges, devBuild).then(
            () => {
              if (needToRestartNode) {
                killNode().then(() => {
                  nodePromise = spawnNode();
                  console.log(`\n\n\x1b[92mStill watching the folder '${folder}'\x1b[0m`);
                });
              }
              else {
                console.log(`\n\x1b[92mStill watching the folder '${folder}'\x1b[0m`);
              }
            }
          ).catch(() => {
            killNode().then(() => { process.exit(0) });
          });
          currentChanges = {};
        }, 10);
      }
    );

    // make `process.stdin` begin emitting "keypress" events
    keypress(process.stdin);

    // listen for the "keypress" event
    process.stdin.on('keypress',
      function (ch, key) {
        if (key) {
          switch(key.name) { // eslint-disable-line default-case
            case 'c':
            if (key.ctrl) {
              killNode().then(() => {
                process.exit(0);
              });
            }
            else {
              process.stdout.write('\x1b[0;0H\x1b[2J\x1bc\x1b[0;0H');
            }
            break;

            case 'd':
              runInDebug =! runInDebug;
              console.log(`\n\x1b[${runInDebug ? '41':'42'}m\x1b[93m Debugging has been turned \x1b[97m${runInDebug?'on':'off'} \x1b[0m`);
              killNode().then(() => {
                nodePromise = spawnNode();
                console.log(`\n\n\x1b[92mStill watching the folder '${folder}'\x1b[0m`);
              });
              break;

            case 'r':
              killNode().then(() => {
                nodePromise = spawnNode();
                console.log(`\n\n\x1b[92mStill watching the folder '${folder}'\x1b[0m`);
              });
              break;
          }
        }
      }
    );

    try {
      process.stdin.setRawMode(true);
      process.stdin.resume();
    }

    catch(ex) {
      console.warn('Unable to turn on key handler. Key events may not work.');
    }

    console.log(`\x1b[92mWatching the folder '${folder}'\x1b[0m`);
    if (nodeFiles) {
      nodePromise = spawnNode();
    }
  }

  catch(ex) {
    console.error(`Unable to read ${configFileName}\n${ex.stack}`);
    return Promise.reject(new Error(1));
  }

  return Promise.resolve();
}

function killNode() {
  if (childNode) {
    childNode.on('exit', () => {
      childNode.stdin.pause();
      childNode = null;
    });

    console.log('Shutting down running instance of node');
    childNode.kill('SIGTERM');
  }

  return nodePromise;
}

function spawnNode() {
  return new Promise(
    (resolve) => {
      const argList = ['dist/app'];
      if (runInDebug) {
        argList.unshift('--inspect-brk');
      }

      console.log(`\nStarting Node...`);
      childNode = spawn(NODE, argList, {cwd});

      childNode.stdout.on('data', (data) => {
        process.stdout.write(data);
      });

      childNode.stderr.on('data', (data) => {
        process.stderr.write(data);
      });

      childNode.on('close', (code) => {
        console.log('Finished. Exited with code:', code);
        resolve(code);
      });

      childNode.on('error', (err) => {
        console.log('Failed to start the build.', err);
        resolve(err);
      });
    }
  );
}

function spawnBuild(changes, isDevBuild) {
  return new Promise(
    (resolve, reject) => {
      //console.log(JSON.stringify(changes, 0, 2));
      console.log('Running build...');
      const args = ['omega','build','--verbose'];
      if (isDevBuild) {
        args.push('--noconcat');
      }
      Object.entries(changes).forEach(
        ([key, value]) => {
          if (value.exists === false) {
            args.push('--del');
            args.push(`"src/${key.replace(/\\/g, '/')}"`);
          }
        }
      );
      console.log(`Running: \x1b[32mnpx ${args.join(' ')}\x1b[0m`);
      const child = spawn(NPX, args, {cwd, env: process.env});

      child.stdout.on('data', (data) => {
        process.stdout.write(data);
      });

      child.stderr.on('data', (data) => {
        process.stderr.write(data);
      });

      child.on('close', (code) => {
        console.log('Finished. Exited with code:', code);
        if (code !== 0) {
          reject(code);
        } else {
          resolve(code);
        }
      });

      child.on('error', (err) => {
        console.log('Failed to start the build.', err);
        resolve(err);
      });
    }
  );
}

module.exports = watch;
