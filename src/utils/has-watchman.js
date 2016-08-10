import { execSync } from 'child_process';

export default function hasWatchman() {
  try {
    execSync('watchman version', { silent: true, stdio: [] });
    return true;
  } catch (err) {
    return false;
  }
}
