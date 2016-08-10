#!/usr/bin/env node
/* eslint-disable global-require, import/newline-after-import */
import 'loud-rejection/register';
import { docopt } from 'docopt';
import setupWatches from '.';

const doc = `
Usage:
  nurture <target>
`;
const args = docopt(doc, { version: require('../package.json').version });

setupWatches(args['<target>']);
