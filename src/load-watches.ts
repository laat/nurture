import fs from "fs/promises";
import path from "path";
import findFiles from "./utils/find-files.js";
import JSON5 from "json5";

export type WatchDefinition = {
  command: string;
  patterns: Array<string>;
  settle?: number;
  appendFiles?: boolean;
  appendSeparator?: string;
  delete?: boolean;
  add?: boolean;
  change?: boolean;
};

export type WatchFile = {
  [target: string]: Array<WatchDefinition>;
};

export type WatchDir = {
  wd: string;
  data: WatchFile;
};

async function loadWatches(): Promise<Array<WatchDir>> {
  const watchFiles = await findFiles(".watch", process.cwd(), [
    "**/node_modules",
    ".git",
  ]);
  const files = await Promise.all(
    watchFiles.map(async (file) => {
      try {
        const data = await fs.readFile(file, "utf8");
        return { wd: path.dirname(file), data: JSON5.parse(data) };
      } catch (err) {
        console.error(`Failed to read ${file}`);
        throw err;
      }
    })
  );
  if (files.length === 0) {
    throw new Error("found no .watch files");
  }
  return files;
}
export default loadWatches;
