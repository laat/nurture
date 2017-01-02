// @flow
/* eslint-disable no-console */
import chalk from 'chalk';
import createWatcher from './watch';
import loadWatches from './load-watches';
import hasWatchman from './utils/has-watchman';
import type { WatchDefinition } from './load-watches';
import getConfig from './config';


type Targets = {
  [target: string]: Array<{wd: string, data: Array<WatchDefinition> }>
};
const getTargets = (definitions): Targets => {
  const targets = {};
  definitions.forEach((def) => {
    Object.keys(def.data).forEach((target) => {
      targets[target] = (targets[target] || []);
      targets[target].push({ wd: def.wd, data: def.data[target] });
    });
  });
  return targets;
};

const setupPhaseWatch = (definitions, watcher, config) => (phase) => {
  definitions.forEach(({ wd, data: phaseData }) => {
    if (!phaseData[phase]) {
      return;
    }
    const phaseWatches = phaseData[phase];
    phaseWatches.forEach(watcher.add(wd, config[phase]));
  });
};

const setupWatches = async (phase: string|Array<string>) => {
  let phases;
  if (typeof phase === 'string') {
    phases = [phase];
  } else {
    phases = phase;
  }
  const [definitions, watchman, config] = await Promise.all([
    loadWatches(),
    hasWatchman(),
    getConfig(),
  ]);
  const watcher = createWatcher(watchman, config);
  const setup = setupPhaseWatch(definitions, watcher, config);

  phases.forEach(setup);

  const targets = getTargets(definitions);
  phases.forEach((p) => {
    if (!Object.keys(targets).includes(p)) {
      console.error(`\n${chalk.yellow('WARNING')}: target ${chalk.yellow(p)} not found in any .watch files\n`);
    }
  });

  watcher.start();
};

export const listTargets = async (): Promise<Targets> => {
  const definitions = await loadWatches();
  return getTargets(definitions);
};

export default setupWatches;
