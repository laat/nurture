// @flow
/* eslint-disable no-console */
import sane from 'sane';
import chalk from 'chalk';
import ora from 'ora';
import { queue } from 'async';
import execCommand from './utils/exec';


const check = (bool?: boolean) => (bool ? chalk.green('✓') : chalk.red('✗'));

const printDefinition = (wd, {
  change,
  add,
  delete: del,
  command,
  patterns,
}: WatchDefinition) => {
  let warning = '';
  if (change === false && del === false && add === false) {
    warning = `\n${chalk.yellow('WARNING')}: not listening to any triggers`;
    return;
  }

  console.log(`
> Watching ${wd}
> Patterns: ${patterns.join(', ')}
> Command: '${command}'
> Triggers: add ${check(add)} change ${check(change)} delete ${check(del)} ${warning}`);
};

async function exec(wd, command, files, appendFiles, config) {
  if (files.length === 0) {
    return;
  }

  let commandToRun;
  if (appendFiles) {
    commandToRun = `${command} ${files.join(' ')}`;
  } else {
    commandToRun = command;
  }

  console.log(`\n> ${chalk.green('Watch triggered at')}: ${wd}\n> ${commandToRun}`);
  const options = { shell: true, cwd: wd, env: process.env };
  await execCommand(commandToRun, options, config);
}

export default (watchman: boolean) => {
  const spinner = ora('Watching for changes');
  const startSpinner = () => {
    spinner.start();
  };

  const taskQueue = queue((fn, cb) => {
    fn().then(cb).catch((err) => {
      console.error('Task failed', err);
      cb();
    });
  }, 1);
  taskQueue.drain = startSpinner;

  const addDefinition = (wd: string, config: PhaseConfig = {}) => ({
    patterns,
    command,
    appendFiles = false,
    add = true,
    delete: del = false,
    change = true,
  }: WatchDefinition) => {
    const watchDefinition = {
      patterns,
      command,
      appendFiles,
      add,
      delete: del,
      change,
    };

    printDefinition(wd, watchDefinition);

    const watcher = sane(wd, { glob: patterns, watchman });
    const newChanges = new Set();

    const newChange = file => {
      newChanges.add(file);
      taskQueue.push(async () => {
        spinner.stop();
        const files = Array.from(newChanges);
        newChanges.clear();

        await exec(wd, command, files, appendFiles, config);
      });
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

  return {
    add: addDefinition,
    start: startSpinner,
  };
};
