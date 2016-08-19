// @flow
/* eslint-disable no-console */
import nativeFS from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import pify from 'pify';
import watch from './watch';
import findFiles from './utils/find-files';
import hasWatchman from './utils/has-watchman';

const fs = pify(nativeFS);

async function loadWatches() {
  const watchFiles = await findFiles('.watch', process.cwd(), ['**/node_modules', '.git']);
  const files = await Promise.all(watchFiles.map(async file => {
    try {
      const data = await fs.readFile(file);
      return { wd: path.dirname(file), data: JSON.parse(data) };
    } catch (err) {
      console.error(`Failed to read ${file}`);
      throw err;
    }
  }));
  if (files.length === 0) {
    throw new Error('found no .watch files');
  }
  return files;
}

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
