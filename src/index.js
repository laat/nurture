// @flow
/* eslint-disable no-console */
import nativeFS from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import pify from 'pify';
import sane from 'sane';
import findFiles from './utils/find-files';
import hasWatchman from './utils/has-watchman';

const fs = pify(nativeFS);

async function loadWatches() {
  const watchFiles = await findFiles('.watch', process.cwd(), ['**/node_modules', '.git']);
  const files = await Promise.all(watchFiles.map(async file => {
    const data = await fs.readFile(file);
    return { wd: path.dirname(file), data: JSON.parse(data) };
  }));
  if (files.length === 0) {
    throw new Error('found no .watch files');
  }
  return files;
}

const watch = (wd, watchman) => (watchDefinition) => {
  console.log(`
> Watching ${wd}
> Patterns: ${watchDefinition.patterns}
> Command: '${watchDefinition.command}'
`);
  const watcher = sane(wd, {
    glob: watchDefinition.patterns,
    watchman,
  });

  function exec(file) {
    let command;
    if (watchDefinition.appendFiles) {
      command = `${watchDefinition.command} ${file}`;
    } else {
      command = watchDefinition.command;
    }
    try {
      console.log(`\n> Watch triggered at: ${wd}\n> Executing ${command}`);
      execSync(command, { shell: true, stdio: [0, 1, 2], cwd: wd, env: process.env });
    } catch (err) {
      console.log(`\n> Command '${command}' failed with ${err.status}`);
    }
    console.log('\n> Watching for changes');
  }
  watcher.on('change', exec);
  watcher.on('add', exec);
  watcher.on('delete', exec);
};

const setupWatches = async (phase: string) => {
  const [definitions, watchman] = await Promise.all([loadWatches(), hasWatchman()]);
  definitions.forEach(({ wd, data: phaseData }) => {
    if (!phaseData[phase]) {
      return;
    }
    const phaseWatches = phaseData[phase];
    phaseWatches.forEach(watch(wd, watchman));
  });
  console.log('> Watching for changes');
};

export default setupWatches;
