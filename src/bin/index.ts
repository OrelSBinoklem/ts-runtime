#!/usr/bin/env node

import './handlers';
import * as path from 'path';
import * as ts from 'typescript';
import * as program from 'commander';
import { Options, defaultOptions } from '../options';
import { transform, getOptions } from '../transform';
import * as bus from '../bus';

const pkg = require('../../package.json');
const options: Options = { log: false, compilerOptions: {} };
let compilerOptions: string = '{}';

function defaultAction() {
  const files: string[] = program.args
    .filter(arg => typeof arg === 'string')
    .map(file => path.normalize(file));

  if (files.length === 0) {
    // TODO: abort, no files
  }

  const entryFile: string = files[0];
  const basePath = path.dirname(entryFile);

  const opts = ts.convertCompilerOptionsFromJson(JSON.parse(compilerOptions), basePath);

  if (opts.errors.length > 0) {
    // TODO: abort, compiler options error
  }

  options.compilerOptions = opts.options;

  transform(entryFile, options);
  process.exit();
}

function setFinishOnError() {
  options.finishOnError = true;
}

function setKeepTempFiles() {
  options.keepTempFiles = true;
}

function setTempFolder(name: string) {
  options.tempFolderName = name;
}

function setLib(lib: string) {
  options.libNamespace = lib;
}

function setNamespace(namespace: string) {
  options.libNamespace = namespace;
}

function setCompilerOptions(opts: string) {
  compilerOptions = opts;
}

program
  .version(pkg.version, '-v, --version')
  .description(`---------  ts-runtime  ---------
  Inserts runtime type checks for
  your  TypeScript  applications.
  --------------------------------`)
  .usage('[options] <file>')
  .option('-c --compiler-options <compilerOptions>', 'set TypeScript compiler options. defaults to {}', setCompilerOptions)
  .option('-f, --force', 'try to finish on TypeScript compiler error. defaults to false', setFinishOnError)
  .option('-k, --keep-temp-files', 'keep temporary files. default to false', setKeepTempFiles)
  .option('-l --lib <name>', 'lib import name. defaults to t', setLib)
  .option('-n --namespace <namespace>', 'prefix for lib and code additions. defaults to _', setNamespace)
  .option('-t, --temp-folder <name>', 'set folder name for temporary files. defaults to .tsr', setTempFolder)
  .on('--help', () => {
    console.log('  Examples:');
    console.log();
    console.log('    $ tsr entry.ts');
    console.log('    $ tsr entry.ts --force');
    console.log('    $ tsr -c \'{ "strictNullChecks": "true" }\' entry.ts');
    console.log();
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit();
} else {
  defaultAction();
}