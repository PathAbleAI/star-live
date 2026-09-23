// Put the live deck back to its "being built live" state (after a rehearsal).
//   node reset.mjs              -> resets the local file only
//   node reset.mjs --publish    -> resets and publishes, so the public link shows the waiting page
import { writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const waiting = {
  title: 'This deck is being built live',
  event: 'ACCSES NJ STAR Conference 2026 · Wednesday, October 7, 3:00 PM · Hard Rock Atlantic City',
  status: 'building',
  statusText: 'Starts Wednesday, October 7 at 3:00 PM',
  progress: [],
  slides: []
};
writeFileSync(join(ROOT, 'docs', 'decks', 'live.js'), 'DECK(' + JSON.stringify(waiting, null, 2) + ');\n');
rmSync(join(ROOT, 'transcripts'), { recursive: true, force: true });
mkdirSync(join(ROOT, 'transcripts'));
console.log('✔ Live deck reset to the waiting page. Transcripts folder emptied.');
if (process.argv.includes('--publish')) execFileSync(process.execPath, ['publish.mjs', 'live'], { cwd: ROOT, stdio: 'inherit' });
