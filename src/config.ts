import { findUp } from "find-up";
import multipipe from "multipipe";
import { Duplex } from "stream";

export type PhaseConfig = {
  stdout?: Array<() => Duplex>;
  stderr?: Array<() => Duplex>;
};
export type Config = {
  [key: string]: PhaseConfig;
};
export type StdIoConfig = {
  stdout?: () => Duplex;
  stderr?: () => Duplex;
};
export type WatchConfig = {
  [key: string]: {
    stdout?: () => Duplex;
    stderr?: () => Duplex;
  };
};

const getConfig = async (): Promise<WatchConfig> => {
  const configFile = await findUp(".nurture.js");
  if (!configFile) {
    return {};
  }
  const config: Config = await import(configFile);

  return Object.fromEntries(
    Object.entries(config).map(([key, phase]) => [
      key,
      {
        stdout: () => multipipe((phase.stdout || []).map((fn) => fn())),
        stderr: () => multipipe((phase.stderr || []).map((fn) => fn())),
      },
    ])
  );
};

export default getConfig;
