declare type PhaseConfig = {
  stdout?: Function,
  stderr?: Function,
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
