/* eslint-disable no-console */
import { spawn } from 'child_process';

export default function exec(command: string, options: Object, config: PhaseConfig) {
  return new Promise((resolve, reject) => {
    const stdio = [
      'inherit',
      config.stdout ? 'pipe' : 'inherit',
      config.stderr ? 'pipe' : 'inherit',
    ];
    const child = spawn(command, { ...options, stdio });
    if (config.stdout) {
      child.stdout.pipe(config.stdout()).pipe(process.stdout);
    }
    if (config.stderr) {
      child.stderr.pipe(config.stderr()).pipe(process.stderr);
    }
    child.on('close', (code) => {
      if (code !== 0) {
        console.log(`\n> [${options.cwd}] '${command}': exited with code ${code}`);
      }
      resolve();
    });
    child.on('error', reject);
  });
}
