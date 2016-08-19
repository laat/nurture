#!/usr/bin/env node
/* eslint-disable global-require, import/newline-after-import */
import 'loud-rejection/register';
import setupWatches from '.';
import ls from './commands/ls';

if (process.argv[2]) {
  setupWatches(process.argv[2]);
} else {
  ls();
}
