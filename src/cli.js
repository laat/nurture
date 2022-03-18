#!/usr/bin/env node
import setupWatches from "./index.js";
import ls from "./commands/ls.js";

if (process.argv.length > 2) {
  setupWatches(process.argv.slice(2));
} else {
  ls();
}
