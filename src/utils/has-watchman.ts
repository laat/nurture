import { execSync } from "child_process";

export default function hasWatchman() {
  try {
    execSync("watchman version", { stdio: [] });
    return true;
  } catch (err) {
    return false;
  }
}
