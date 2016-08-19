/* eslint-disable no-console */
import nativeFS from 'fs';
import path from 'path';
import pify from 'pify';
import findFiles from './utils/find-files';

const fs = pify(nativeFS);

async function loadWatches() {
  const watchFiles = await findFiles(
      '.watch',
      process.cwd(),
      ['**/node_modules', '.git']
  );
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
export default loadWatches;
