import { findUp } from "find-up";
import multipipe from "multipipe";
import fs from "fs";

const getConfig = async () => {
  const configFile = await findUp(".nurture.js");
  if (!configFile) {
    return {};
  }
  const config = await import(configFile);
  //

  Object.keys(config)
    .map((phase) => config[phase])
    .forEach((phase) => {
      if (phase.stdout && phase.stdout.length > 1) {
        const pipes = phase.stdout;
        phase.stdout = () => multipipe(...pipes.map((f) => f())); // eslint-disable-line
      } else if (phase.stdout && phase.stdout.length === 1) {
        phase.stdout = phase.stdout[0]; // eslint-disable-line
      }
      if (phase.stderr && phase.stderr.length > 1) {
        const pipes = phase.stderr;
        phase.stderr = () => multipipe(...pipes.map((f) => f())); // eslint-disable-line
      } else if (phase.stderr && phase.stderr.length === 1) {
        phase.stderr = phase.stderr[0]; // eslint-disable-line
      }
    });
  return config;
};

export default getConfig;
