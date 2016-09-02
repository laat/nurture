// @flow
/* eslint-disable no-console */
import { spawn } from 'child_process';
import chalk from 'chalk';
import type { PhaseConfig } from '../config';

export default function exec(command: string, options: Object, config: PhaseConfig) {
  return new Promise((resolve, reject) => {
    const stdio = [
      'inherit',
      config.stdout ? 'pipe' : 'inherit',
      config.stderr ? 'pipe' : 'inherit',
    ];
    const child = spawn(command, { ...options, stdio });
    let stdout;
    if (config.stdout) {
      stdout = config.stdout();
      child.stdout.pipe(stdout).pipe(process.stdout);
    }
    let stderr;
    if (config.stderr) {
      stderr = config.stderr();
      child.stderr.pipe(stderr).pipe(process.stderr);
    }
    child.on('exit', (code) => {
      if (code !== 0) {
        console.log(`
> ${chalk.red('ERROR')} [${options.cwd}]
> '${command}': exited with code ${code}
`);
      }
      if (stdout) {
        stdout.unpipe();
      }
      if (stderr) {
        stderr.unpipe();
      }
      resolve();
    });
    child.on('error', reject);
  });
}
