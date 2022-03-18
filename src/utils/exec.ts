import { spawn, SpawnOptionsWithoutStdio } from "child_process";
import chalk from "chalk";
import { StdIoConfig } from "../config";

export default function exec(
  command: string,
  options: SpawnOptionsWithoutStdio,
  config: StdIoConfig
) {
  return new Promise<void>((resolve, reject) => {
    const stdio: any[] = [
      "inherit",
      config.stdout ? "pipe" : "inherit",
      config.stderr ? "pipe" : "inherit",
    ];
    const child = spawn(command, { ...options, stdio });
    let stdout: NodeJS.ReadWriteStream;
    if (config.stdout) {
      stdout = config.stdout();
      child.stdout.pipe(stdout).pipe(process.stdout);
    }
    let stderr: NodeJS.ReadWriteStream;
    if (config.stderr) {
      stderr = config.stderr();
      child.stderr.pipe(stderr).pipe(process.stderr);
    }
    child.on("exit", (code) => {
      if (code !== 0) {
        console.log(`
> ${chalk.red("ERROR")} [${options.cwd}]
> '${command}': exited with code ${code}
`);
      }
      if (stdout) {
        stdout.unpipe();
      }
      if (stderr) {
        stderr.unpipe();
      }
      resolve();
    });
    child.on("error", reject);
  });
}
