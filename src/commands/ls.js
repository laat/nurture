// @flow
/* eslint-disable no-console */
import chalk from 'chalk';
import { listTargets } from '..';

const ls = async () => {
  console.log(`Uasage:
  nurture <target>...

Examples:
  nurture build
  nurture build test

  `);
  console.log(chalk.bold(chalk.yellow('Targets:')));
  const targets = await listTargets();
  Object.keys(targets).forEach(target => {
    console.log(chalk.yellow(target));
    targets[target].forEach(defs => {
      console.log(`  ${chalk.gray(defs.wd)}`);
      defs.data.forEach(d => {
        const appending = d.appendFiles ? chalk.magenta('appendFiles') : '';
        const patterns = chalk.dim(chalk.green(d.patterns.join(', ')));
        console.log(`    ${patterns} ${d.command} ${appending}`);
      });
    });
  });
};

export default ls;
