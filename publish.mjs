// Publish a deck to the public link, then wait until the link really shows it.
//   node publish.mjs            -> checks and publishes docs/decks/live.js
//   node publish.mjs closing    -> another deck
//   node publish.mjs --check    -> checks only, publishes nothing
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SITE = 'https://pathableai.github.io/star-live/';
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const deck = (args.find(a => !a.startsWith('--')) || 'live').replace(/[^a-z0-9-]/gi, '');
const file = join(ROOT, 'docs', 'decks', deck + '.js');

const LIMITS = { title: 9, bullet: 14, stepH: 8, stepP: 16, splitItem: 12, big: 5 };
const LAYOUTS = ['title', 'bullets', 'steps', 'split', 'big', 'quote', 'qr'];
const problems = [], warnings = [];
const words = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;

// 1. Read and parse the deck file (DECK({...}); wrapper around JSON).
const src = readFileSync(file, 'utf8');
let data;
try {
  data = JSON.parse(src.slice(src.indexOf('(') + 1, src.lastIndexOf(')')));
} catch (e) {
  console.error(`✖ ${deck}.js is not valid. ${e.message}`);
  process.exit(1);
}

// 2. House rules: no em dashes anywhere, ever.
if (/—/.test(src)) problems.push('Contains an em dash. Rewrite those sentences.');

// 3. Structure checks (skipped while the deck is still in its "building" state).
const building = data.status === 'building';
if (!data.title) problems.push('Deck needs a title.');
if (!building) {
  const slides = data.slides || [];
  if (slides.length < 3 || slides.length > 14) problems.push(`Deck has ${slides.length} slides; expected 3 to 14.`);
  slides.forEach((s, i) => {
    const n = `Slide ${i + 1}`;
    const L = s.layout || 'bullets';
    if (!LAYOUTS.includes(L)) problems.push(`${n}: unknown layout "${L}".`);
    if (!s.title) problems.push(`${n}: missing title.`);
    if (words(s.title) > LIMITS.title && L !== 'quote') warnings.push(`${n}: title is ${words(s.title)} words (aim for ${LIMITS.title} or fewer).`);
    if (!s.notes || words(s.notes) < 25) problems.push(`${n}: presenter notes missing or too short.`);
    if (L === 'bullets') {
      if (!s.bullets?.length || s.bullets.length > 5) problems.push(`${n}: needs 1 to 5 bullets.`);
      s.bullets?.forEach(b => words(b) > LIMITS.bullet && warnings.push(`${n}: long bullet "${b.slice(0, 40)}…"`));
    }
    if (L === 'steps') {
      if (!s.steps?.length || s.steps.length > 5) problems.push(`${n}: needs 1 to 5 steps.`);
      s.steps?.forEach(x => {
        if (words(x.h) > LIMITS.stepH) warnings.push(`${n}: long step heading "${x.h}"`);
        if (words(x.p) > LIMITS.stepP) warnings.push(`${n}: long step line "${String(x.p).slice(0, 40)}…"`);
      });
    }
    if (L === 'split') {
      if (!s.left || !s.right) problems.push(`${n}: split needs left and right.`);
      [s.left, s.right].forEach(c => c?.items?.length > 4 && problems.push(`${n}: split column has more than 4 items.`));
      [s.left, s.right].forEach(c => c?.items?.forEach(b => words(b) > LIMITS.splitItem && warnings.push(`${n}: long item "${b.slice(0, 40)}…"`)));
    }
    if (L === 'big' && words(s.big) > LIMITS.big) warnings.push(`${n}: big text is ${words(s.big)} words.`);
    if (L === 'quote' && !s.quote) problems.push(`${n}: quote slide needs a quote.`);
  });
}

warnings.forEach(w => console.log('⚠ ' + w));
if (problems.length) {
  problems.forEach(p => console.log('✖ ' + p));
  console.log(`\nNot published. Fix ${problems.length} problem(s) and run again.`);
  process.exit(1);
}
console.log(`✔ ${deck} deck checks out (${building ? 'building state' : data.slides.length + ' slides'}).`);
if (checkOnly) process.exit(0);

// 4. Push to GitHub. Transcripts are git-ignored and never leave this computer.
const git = (...a) => execFileSync('git', a, { cwd: ROOT, stdio: 'pipe' }).toString().trim();
try {
  git('add', 'docs');
  if (git('diff', '--cached', '--name-only')) git('commit', '-m', `Publish ${deck}: ${data.title}`);
  git('push', '-q', 'origin', 'HEAD');
} catch (e) {
  console.error('✖ Could not push to GitHub. Check the internet connection.\n' + (e.stderr || e.message));
  console.error('The deck still works on this laptop. Present from the local file.');
  process.exit(1);
}
console.log('✔ Sent to GitHub. Waiting for the public link to update…');

// 5. Wait until the public copy matches what we just wrote (GitHub Pages takes ~30 to 90 seconds).
const want = src.trim().replace(/\r\n/g, '\n');
const start = Date.now();
while (Date.now() - start < 240000) {
  try {
    const res = await fetch(`${SITE}decks/${deck}.js?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok && (await res.text()).trim().replace(/\r\n/g, '\n') === want) {
      console.log(`✔ LIVE after ${Math.round((Date.now() - start) / 1000)}s: ${SITE}${deck === 'live' ? '' : '?deck=' + deck}`);
      process.exit(0);
    }
  } catch { /* keep waiting */ }
  process.stdout.write('.');
  await new Promise(r => setTimeout(r, 5000));
}
console.log('\n⚠ Pushed, but the public link has not updated after 4 minutes. It usually catches up; phones refresh on their own.');
