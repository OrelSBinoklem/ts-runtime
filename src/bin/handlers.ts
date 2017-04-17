import * as cp from 'child_process';
import * as path from 'path';
import * as ts from 'typescript';
import * as bus from '../bus';
import * as util from './util';

const child = cp.fork(path.join(__dirname, './status'));

// TODO: check how to safely output pending events before killing child
process.on('exit', () => {
  // console.log('EXIT');
  child.kill();
});

child.on('exit', () => {
  // console.log('CHILD EXIT');
  process.exit();
});

function handleError(error: string | Error) {
  child.send({ message: 'error', payload: util.getError(error) });
}

process.on('uncaughtException', handleError);
process.on('unhandledRejection', handleError);

bus.emitter.on(bus.events.ERROR, handleError);

bus.emitter.on(bus.events.START, (args: any[]) => {
  child.send({ message: 'start', payload: args });
});

bus.emitter.on(bus.events.TRANSFORM, (args: any[]) => {
  const sourceFiles = args[0] as ts.SourceFile[];
  const fileNames = sourceFiles.map(sf => sf.fileName);

  child.send({ message: 'transform', payload: fileNames });
});

bus.emitter.on(bus.events.DIAGNOSTICS, (args: any[]) => {
  const diagnostics = args[0] as ts.Diagnostic[];
  let formatted: string[] = [];

  for (let diag of diagnostics) {
    formatted.push(ts.formatDiagnostics([diag], {
      getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
      getNewLine: () => ts.sys.newLine,
      getCanonicalFileName: (f: string) => f
    }).trim());
  }

  const diags = formatted.filter(str => str.trim().length > 0);

  child.send({ message: 'diagnostics', payload: diags });
});

bus.emitter.on(bus.events.CLEANUP, (args: any[]) => {
  child.send({ message: 'cleanup', payload: args });
});

bus.emitter.on(bus.events.STOP, (args: any[]) => {
  child.send({ message: 'stop', payload: args });
});

bus.emitter.on(bus.events.END, (args: any[]) => {
  child.send({ message: 'end', payload: args });
});


// process.on('SIGINT', () => {
//   child.send({message: 'term'});
// });
//
// process.on('SIGTERM', () => {
//   process.stdin.resume();
//   child.send({message: 'term'});
// });