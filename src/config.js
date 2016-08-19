import findUp from 'find-up';
import nativeFS from 'fs';
import pify from 'pify';
import multipipe from 'multipipe';

const fs = pify(nativeFS);

const getConfig = async (): Config => {
  const configFile = await findUp('.nurture.json');
  if (!configFile) {
    return {};
  }
  const configData = await fs.readFile(configFile);
  const config = JSON.parse(configData);

  function requireStream(name) {
    // $FlowIssue
    let createStream = require(name); // eslint-disable-line
    if (typeof createStream !== 'function' && createStream.default) {
      createStream = createStream.default;
    }
    if (typeof createStream !== 'function') {
      throw new TypeError(`require('${name}')() is not a function`);
    }
    try {
      createStream();
    } catch (err) {
      throw new TypeError(`could not call require('${name}')() `);
    }
    if (!createStream().pipe) {
      throw new TypeError(`require('${name}')() is not a pipe`);
    }
    return createStream;
  }
  Object.keys(config)
  .map(phase => config[phase])
  .forEach(phase => {
    if (phase.stdout && phase.stdout.length > 1) {
      const pipes = phase.stdout.map(requireStream);
      phase.stdout = () => multipipe(...pipes.map(f => f())); // eslint-disable-line
    } else if (phase.stdout && phase.stdout.length === 1) {
      phase.stdout = requireStream(phase.stdout[0]); // eslint-disable-line
    }
    if (phase.stderr && phase.stderr.length > 1) {
      const pipes = phase.stderr.map(requireStream);
      phase.stderr = () => multipipe(...pipes.map(f => f())); // eslint-disable-line
    } else if (phase.stderr && phase.stderr.length === 1) {
      phase.stderr = requireStream(phase.stderr[0]); // eslint-disable-line
    }
  });
  return config;
};

export default getConfig;
