// @flow
/* eslint-disable no-console */
import nativeFS from 'fs';
import path from 'path';
import pify from 'pify';
import findFiles from './utils/find-files';

const fs = pify(nativeFS);

export type WatchDefinition = {
  command: string,
  patterns: Array<string>,
  settle?: number,
  appendFiles?: boolean,
  appendSeparator?: string,
  delete?: boolean,
  add?: boolean,
  change?: boolean,
};

export type WatchFile = {
  [target: string]: Array<WatchDefinition>
};

async function loadWatches(): Promise<Array<{wd: string, data:WatchFile}>> {
  const watchFiles = await findFiles(
    '.watch',
    process.cwd(),
    ['**/node_modules', '.git'],
  );
  const files = await Promise.all(watchFiles.map(async (file) => {
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
export default loadWatches;
