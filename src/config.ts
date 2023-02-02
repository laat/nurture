import { findUp } from "find-up";
import multipipe from "multipipe";

interface Duplex extends NodeJS.ReadableStream, NodeJS.WritableStream {}

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
  const configFile = await findUp([".nurture.js", ".nurture.cjs"]);
  if (!configFile) {
    return {};
  }
  const config: Config = (await import(configFile)).default;

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
