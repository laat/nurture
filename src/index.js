// @flow
/* eslint-disable no-console */
import createWatcher from './watch';
import loadWatches from './load-watches';
import hasWatchman from './utils/has-watchman';
import type { WatchDefinition } from './load-watches';
import getConfig from './config';

const setupPhaseWatch = (definitions, watcher, config) => phase => {
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

  watcher.start();
};

type Targets = {
  [target: string]: Array<{wd: string, data: Array<WatchDefinition> }>
};
export const listTargets = async (): Promise<Targets> => {
  const definitions = await loadWatches();
  const targets = {};
  definitions.forEach(def => {
    Object.keys(def.data).forEach(target => {
      targets[target] = (targets[target] || []);
      targets[target].push({ wd: def.wd, data: def.data[target] });
    });
  });
  return targets;
};

export default setupWatches;
