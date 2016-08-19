import { spawn } from 'child_process';

export default function exec(command: string, options: Object) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, options);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`exited with code ${code}`));
      }
    });
    child.on('error', reject);
  });
}
