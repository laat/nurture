import sane from 'sane';
import { execSync } from 'child_process';

const watch = (wd, watchman) => (watchDefinition) => {
  console.log(`
> Watching ${wd}
> Patterns: ${watchDefinition.patterns}
> Command: '${watchDefinition.command}'
`);
  const watcher = sane(wd, {
    glob: watchDefinition.patterns,
    watchman,
  });

  function exec(file) {
    let command;
    if (watchDefinition.appendFiles) {
      command = `${watchDefinition.command} ${file}`;
    } else {
      command = watchDefinition.command;
    }
    try {
      console.log(`\n> Watch triggered at: ${wd}\n> Executing ${command}`);
      execSync(command, { shell: true, stdio: [0, 1, 2], cwd: wd, env: process.env });
    } catch (err) {
      console.log(`\n> Command '${command}' failed with ${err.status}`);
    }
    console.log('\n> Watching for changes');
  }
  watcher.on('change', exec);
  watcher.on('add', exec);
  watcher.on('delete', exec);
};

export default watch;
