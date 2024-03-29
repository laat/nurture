import chalk from "chalk";
import createWatcher, { Watcher } from "./watch.js";
import loadWatches, { WatchDefinition, WatchDir } from "./load-watches.js";
import hasWatchman from "./utils/has-watchman.js";
import getConfig, { WatchConfig } from "./config.js";

type Targets = {
  [target: string]: Array<{ wd: string; data: Array<WatchDefinition> }>;
};
const getTargets = (definitions: WatchDir[]): Targets => {
  const targets: Targets = {};
  definitions.forEach((def) => {
    Object.keys(def.data).forEach((target) => {
      targets[target] = targets[target] || [];
      targets[target].push({ wd: def.wd, data: def.data[target] });
    });
  });
  return targets;
};

const setupPhaseWatch =
  (definitions: WatchDir[], watcher: Watcher, config: WatchConfig) =>
  (phase: string) => {
    definitions.forEach(({ wd, data: phaseData }) => {
      if (!phaseData[phase]) {
        return;
      }
      const phaseWatches = phaseData[phase];
      phaseWatches.forEach(watcher.add(wd, config[phase]));
    });
  };

const setupWatches = async (phase: string | string[]) => {
  const phases: string[] = typeof phase === "string" ? [phase] : phase;
  const [definitions, watchman, config] = await Promise.all([
    loadWatches(),
    hasWatchman(),
    getConfig(),
  ]);
  const watcher = createWatcher(watchman);
  const setup = setupPhaseWatch(definitions, watcher, config);

  phases.forEach(setup);

  const targets = getTargets(definitions);
  phases.forEach((p) => {
    if (!Object.keys(targets).includes(p)) {
      console.error(
        `\n${chalk.yellow("WARNING")}: target ${chalk.yellow(
          p
        )} not found in any .watch files\n`
      );
    }
  });

  watcher.start();
};

export const listTargets = async () => {
  const definitions = await loadWatches();
  return getTargets(definitions);
};

export default setupWatches;
