// @flow
/* eslint-disable no-console */
import sane from 'sane';
import chalk from 'chalk';
import { queue } from 'async';
import execCommand from './utils/exec';

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

const check = (bool: boolean) => (bool ? chalk.green('✓') : chalk.red('✗'));

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
> Triggers: add ${check(add)} change ${check(change)} delete ${check(del)}`);
  }
  if (change === false && del === false && add === false) {
    console.log(`${chalk.yellow('WARNING')}: not listening to any triggers`);
    return;
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
      await execCommand(command, { ...options, stdio: [0, 1, 2] });
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

