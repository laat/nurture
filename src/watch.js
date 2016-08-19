// @flow
/* eslint-disable no-console */
import sane from 'sane';
import chalk from 'chalk';
import { queue } from 'async';
import { execSync } from 'child_process';

const taskQueue = queue((fn, cb) => {
  fn().then(cb).catch(cb);
}, 1);

type WatchDefinition = {
  command: string,
  patterns: Array<string>,
  appendFiles?: boolean,
  delete?: boolean,
  add?: boolean,
  change?: boolean,
};

const watch = (wd: string, watchman: boolean) => (watchDefinition: WatchDefinition) => {
  console.log(`
> Watching ${wd}
> Patterns: ${watchDefinition.patterns.join(', ')}
> Command: '${watchDefinition.command}'`);
  const { change = true, add = true, delete: del = false } = watchDefinition;
  if (watchDefinition.add != null ||
      watchDefinition.delete != null ||
      watchDefinition.change != null) {
    console.log(`\
> Triggers: add ${chalk.cyan(add)} change ${chalk.cyan(change)} delete ${chalk.cyan(del)}`);
  }
  const watcher = sane(wd, {
    glob: watchDefinition.patterns,
    watchman,
  });

  let newChanges = new Set();

  async function exec() {
    const files = Array.from(newChanges);
    newChanges = new Set();

    if (files.length === 0) {
      return;
    }

    let command;
    if (watchDefinition.appendFiles) {
      command = `${watchDefinition.command} ${files.join(' ')}`;
    } else {
      command = watchDefinition.command;
    }

    try {
      console.log(`\n> Watch triggered at: ${wd}\n> Executing ${command}`);
      const options = { shell: true, cwd: wd, env: process.env };
      await execSync(command, { ...options, stdio: [0, 1, 2] });
    } catch (err) {
      console.log(`\n> [${wd}] '${command}': ${err.message}`);
    }
    console.log('\n> Watching for changes');
  }

  const newChange = file => {
    newChanges.add(file);
    taskQueue.push(exec);
  };

  if (change) {
    watcher.on('change', newChange);
  }
  if (add) {
    watcher.on('add', newChange);
  }
  if (del) {
    watcher.on('delete', newChange);
  }
};

export default watch;

