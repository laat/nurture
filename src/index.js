// @flow
/* eslint-disable no-console */
import createWatcher from './watch';
import loadWatches from './load-watches';
import hasWatchman from './utils/has-watchman';
import getConfig from './config';


const setupWatches = async (phase: string) => {
  const [definitions, watchman, config] = await Promise.all([
    loadWatches(),
    hasWatchman(),
    getConfig(),
  ]);
  const watcher = createWatcher(watchman, config);
  definitions.forEach(({ wd, data: phaseData }) => {
    if (!phaseData[phase]) {
      return;
    }
    const phaseWatches = phaseData[phase];
    phaseWatches.forEach(watcher.add(wd, config[phase]));
  });
  watcher.start();
};

export const listTargets = async () => {
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
