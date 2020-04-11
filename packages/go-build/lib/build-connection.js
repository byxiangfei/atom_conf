'use babel';

import * as path from 'path';
import * as fs from 'fs';

function getVariables (file) {
  const workspaceFile = file && atom.project.relativizePath(file);
  return {
    // the working directory on startup of atom
    cwd: process.cwd(),
    // the open file (full path)
    file,
    // the open file's basename
    fileBasename: file && path.basename(file),
    // the open file's dirname
    fileDirname: file && path.dirname(file),
    // the open file's extension
    fileExtname: file && path.extname(file),
    // the open file relative to the "workspaceRoot" variable
    relativeFile: workspaceFile && workspaceFile[1],
    // the full path of the project root folder
    workspaceRoot: workspaceFile && workspaceFile[0]
  };
}

function updateEnv (config, variables, goconfig) {
  // already assign the already known environment variables here so they can be used by the `config.env` values
  const build_env = config.getState().build.build_env;
  const gc_env = goconfig.environment();
  variables.env =Object.assign({}, gc_env, build_env);
}

function getCwd (config, variables) {
  let { cwd } = config;
  if (cwd) {
    return replaceVariable(cwd, variables);
  }
  let file = variables.file;
  try {
    if (file && fs.lstatSync(file).isDirectory()) {
      cwd = file; // assume it is a package...
    }
  } catch (e) {
    // ...
  }
  if (!cwd && file) {
    cwd = path.dirname(file);
  }
  if (!cwd) {
    cwd = atom.project.getPaths()[0];
  }
  return cwd;
}

function getBuildArgs (command, config, variables) {
  let buildArgs = [command];
  for (let v of Object.values(config.getState().build.build_args)) {
    buildArgs = buildArgs.concat(v.split(/\s+/));
  }
  let prom = Promise.resolve();
  return prom.then(() => buildArgs);
}

/*
Handle spawning the build command with arguments selected by user and directing output to the build output panel.
*/
export default class BuildConnection {
  constructor (spawn, addOutputMessage, goconfig) {
    this._spawn = spawn;
    this._addOutputMessage = addOutputMessage;
    this._goconfig = goconfig;
  }

  start ({ command, config, file }) {
    return new Promise((resolve, reject) => {

      let proc;
      let canceled = false;

      const prepare = () => {
        const variables = getVariables(file);
        updateEnv(config, variables, this._goconfig);
        const cwd = getCwd(config, variables);

        return getBuildArgs(command, config, variables).then((buildArgs) => {
          this._addOutputMessage(Object.values(buildArgs).join(' ') + '\n');
          return {
            buildArgs,
            cwd,
            env: variables.env
          };
        });
      };

      const spawn = ( {buildArgs, cwd, env} ) => {
        config.dispatch({ type: 'SET_STATE', state: 'running' });
        return this._spawn(buildArgs, { cwd: cwd, env: env });
      };

      const io = (goBuildProc) => {
        proc = goBuildProc;
        this._proc = proc;

        proc.stderr.on('data', (chunk) => {
          this._addOutputMessage('Build output: ' + chunk.toString());
        });

        proc.stdout.on('data', (chunk) => this._addOutputMessage(chunk.toString()) );

        const close = () => {
          proc.kill();
          this.dispose();
          canceled = true;
        };

        proc.on('close', (code) => {
          this._addOutputMessage('go build closed with code ' + (code || 0) + '\n');
          config.dispatch({ type: 'SET_STATE', state: 'notStarted' });
          close();
          if (code) {
            reject(new Error('Closed with code ' + code));
          }
        });
        proc.on('error', (err) => {
          this._addOutputMessage('error: ' + (err || '') + '\n');
          config.dispatch({ type: 'SET_STATE', state: 'notStarted' });
          close();
          reject(err);
        });
      };

      prepare().then(spawn).then(io);
    });
  }

  stop() {
    if (this._proc) {
      this._proc.kill();
    }
    return Promise.resolve();
  }

  dispose () {
    this._proc = null;
    return Promise.resolve();
  }

}
