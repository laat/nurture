import sane from "sane";
import debounce from "debounce";
import chalk from "chalk";
import ora from "ora";
import { queue } from "async";

import execCommand from "./utils/exec.js";
import { WatchDefinition } from "./load-watches.js";
import { StdIoConfig } from "./config.js";

const SETTLE_DEFAULT = 200;

const check = (bool?: boolean) => (bool ? chalk.green("✓") : chalk.red("✗"));

const printDefinition = (
  wd: string,
  {
    change,
    add,
    delete: del,
    command,
    patterns,
    settle,
    appendFiles,
    appendSeparator,
  }: WatchDefinition
) => {
  let warning = "";
  if (change === false && del === false && add === false) {
    warning = `\n${chalk.yellow("WARNING")}: not listening to any triggers`;
    return;
  }

  let optionsText = "";
  if (settle !== SETTLE_DEFAULT && settle != null) {
    optionsText += ` settle ${settle}`;
  }

  if (appendFiles === true) {
    const separator = appendSeparator || "";
    optionsText += ` appendFiles ${check(
      appendFiles
    )} appendSeparator "${separator}"`;
  }

  if (optionsText) {
    optionsText = `\n> Options:${optionsText}`;
  }

  console.log(`
> Watching ${wd}
> Patterns: ${patterns.join(", ")}
> Command: '${command}'
> Triggers: add ${check(add)} change ${check(change)} delete ${check(
    del
  )} ${optionsText} ${warning}`);
};

type FilesConfig = {
  files: Array<string>;
  appendFiles: boolean;
  appendSeparator: string;
};
async function exec(
  wd: string,
  command: string,
  config: StdIoConfig,
  filesConfig: FilesConfig
) {
  if (filesConfig.files.length === 0) {
    return;
  }

  let commandToRun;
  if (filesConfig.appendFiles) {
    commandToRun = `${command} ${filesConfig.files.join(
      filesConfig.appendSeparator
    )}`;
  } else {
    commandToRun = command;
  }

  console.log(
    `\n> ${chalk.green("Watch triggered at")}: ${wd}\n> ${commandToRun}`
  );
  const options = { shell: true, cwd: wd, env: process.env };
  await execCommand(commandToRun, options, config);
}

export type Watcher = {
  add: (wd: string, config?: StdIoConfig) => (watch: WatchDefinition) => void;
  start: () => void;
};
export default (watchman: boolean | undefined): Watcher => {
  const spinner = ora("Watching for changes");
  const startSpinner = () => {
    spinner.start();
  };

  const taskQueue = queue<() => Promise<void>>(async (fn, cb) => {
    try {
      await fn();
    } catch (err) {
      console.error("Task failed", err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return cb(err as any);
    }
    cb();
  }, 1);
  taskQueue.drain(startSpinner);

  const addDefinition =
    (wd: string, config: StdIoConfig = {}) =>
    ({
      patterns,
      command,
      appendFiles = false,
      appendSeparator = " ",
      add = true,
      delete: del = false,
      change = true,
      settle = SETTLE_DEFAULT,
    }: WatchDefinition) => {
      const watchDefinition = {
        patterns,
        command,
        settle,
        appendFiles,
        appendSeparator,
        add,
        delete: del,
        change,
      };

      printDefinition(wd, watchDefinition);

      const watcher = sane(wd, { glob: patterns, watchman });
      const newChanges = new Set<string>();

      const processChanges = debounce(() => {
        taskQueue.push(async () => {
          spinner.stop();
          const files = Array.from(newChanges);
          newChanges.clear();
          const filesConfig = {
            files,
            appendFiles,
            appendSeparator,
          };

          await exec(wd, command, config, filesConfig);
        });
      }, settle);

      const newChange = (file: string) => {
        newChanges.add(file);
        processChanges();
      };

      if (change) {
        watcher.on("change", newChange);
      }
      if (add) {
        watcher.on("add", newChange);
      }
      if (del) {
        watcher.on("delete", newChange);
      }
    };

  return {
    add: addDefinition,
    start: startSpinner,
  };
};
