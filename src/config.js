// @flow
import findUp from "find-up";
import multipipe from "multipipe";
import fs from "fs";

export type PhaseConfig = {
  stdout?: Function,
  stderr?: Function
};
export type Config = {
  [key: string]: PhaseConfig
};

const getConfig = async (): Config => {
  const configFile = await findUp(".nurture.js");
  if (!configFile) {
    return {};
  }
  const config = JSON.parse(fs.readFileSync(configFile, "utf8"));

  Object.keys(config)
    .map(phase => config[phase])
    .forEach(phase => {
      if (phase.stdout && phase.stdout.length > 1) {
        const pipes = phase.stdout;
        phase.stdout = () => multipipe(...pipes.map(f => f())); // eslint-disable-line
      } else if (phase.stdout && phase.stdout.length === 1) {
        phase.stdout = phase.stdout[0]; // eslint-disable-line
      }
      if (phase.stderr && phase.stderr.length > 1) {
        const pipes = phase.stderr;
        phase.stderr = () => multipipe(...pipes.map(f => f())); // eslint-disable-line
      } else if (phase.stderr && phase.stderr.length === 1) {
        phase.stderr = phase.stderr[0]; // eslint-disable-line
      }
    });
  return config;
};

export default getConfig;
