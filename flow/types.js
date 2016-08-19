declare type PhaseConfig = {
  stdout: Array<Function>,
  stderr: Array<Function>,
}
declare type Config = {
  [key: string]: PhaseConfig
};

declare type WatchDefinition = {
  command: string,
  patterns: Array<string>,
  appendFiles?: boolean,
  delete?: boolean,
  add?: boolean,
  change?: boolean,
};
