// Open a deck in Edge from this laptop's own copy (no internet needed).
//   node open.mjs                 -> live deck, full-screen presenting
//   node open.mjs closing         -> closing deck, presenting
//   node open.mjs captions        -> the caption page (online copy; speech needs internet anyway)
//   node open.mjs live read       -> phone-style reading view
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const [what = 'live', view = 'present'] = process.argv.slice(2);
const url = what === 'captions'
  ? 'https://pathableai.github.io/star-live/captions.html'
  : pathToFileURL(join(ROOT, 'docs', 'index.html')).href + `?deck=${what}` + (view === 'present' ? '&present=1' : '');
spawn('cmd', ['/c', 'start', '', 'msedge', url], { detached: true, stdio: 'ignore' }).unref();
console.log('Opened ' + url);
if (view === 'present' && what !== 'captions') console.log('Keys: arrows move, F full screen, N notes, S speaker window.');
