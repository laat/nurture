import reEscape from "escape-string-regexp";
import fs from "fs/promises";
import minimatch from "minimatch";
import path from "path";

const isIgnored = (workdir: string, patterns: string[]) => {
  const re = new RegExp(`^${reEscape(workdir)}`);
  return (file: string): boolean =>
    patterns.some((pattern) => minimatch(file.replace(re, ""), pattern));
};

async function findFiles(
  filename: string,
  workdir: string,
  ignore: string[] = []
): Promise<string[]> {
  const files: string[] = [];
  const shouldSkip = isIgnored(workdir, ignore);
  async function walk(dir: string) {
    try {
      const stats = await fs.stat(dir);
      if (stats.isFile() && path.basename(dir) === filename) {
        files.push(dir);
      } else if (stats.isDirectory()) {
        const visit = !(await shouldSkip(dir));
        if (visit) {
          const dirs = await fs.readdir(dir);
          await Promise.all(dirs.map((child) => walk(path.join(dir, child))));
        }
      }
    } catch (e) {
      // ignore
    }
  }
  await walk(workdir);
  return files;
}

export default findFiles;
