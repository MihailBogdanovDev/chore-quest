// Original pixel-art icon generator. Each icon is a <=15x15 character grid, upscaled 2x
// to 32x32 (offset by 1px) and given an automatic 1px dark outline. Node built-ins only.
// Run: node scripts/draw-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'art', 'icons');
const P = {
  k: '#3b2314', w: '#fff8e7', l: '#f1deb0', y: '#ffd23f', o: '#e8962a', d: '#b36a1e',
  r: '#d6403a', R: '#8f2530', g: '#5fb348', G: '#357a38', b: '#4a8fd6', B: '#2d5aa0',
  c: '#a9dcf0', n: '#9a6035', N: '#6b3d20', z: '#c98a4b', s: '#f2c28b',
  p: '#f08aa8', P: '#8a5ac8', L: '#b08fe0', a: '#b8bcc4', A: '#6e7480', K: '#3a3f4f',
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

// procedural helpers (return 15 strings)
function raster(fn) {
  const rows = [];
  for (let y = 0; y < 15; y++) { let s = ''; for (let x = 0; x < 15; x++) s += fn(x, y) || '.'; rows.push(s); }
  return rows;
}
const star4 = (cx, cy, r, x, y) => {
  const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
  return Math.pow(dx, 0.6) + Math.pow(dy, 0.6) <= Math.pow(r, 0.6) + 0.01;
};

const ICONS = {
  'chest-open': [
    '..nnnnnnnnnnn..', '.nNNNNNNNNNNNn.', '.nNNNNNNNNNNNn.', '.nNNNyyyyyNNNn.',
    '..yyoyyyyyyoyy.', '.yyyyyyoyyyyyyy', '.nnnnnnnnnnnnn.', '.nnnnnnnnnnnnn.',
    '.aaaaaaaaaaaaa.', '.nnnnnakanannn.'.replace('nnnnnakanannn', 'nnnnaaykaannn'), '.nnnnnnaannnnn.',
    '.nnnnnnnnnnnnn.', '.nnnnnnnnnnnnn.', '.NNNNNNNNNNNNN.',
  ],
  'xp-star': [
    '.......y.......', '......yyy......', '......yyy......', '.....yyyyy.....',
    'yyyyyyyyyyyyyyy', '.yyyyyyyyyyyyo.', '..yyyyyyyyyyo..', '...yyyyyyyyo...',
    '...yyyyyyyoo...', '..yyyyyyyyyoo..', '..yyyyo.oyyyy..', '.yyyyo...oyyyy.',
    '.yyyo.....oyyy.',
  ],
  check: [
    '............GG.', '...........ggG.', '..........gggG.', '.........gggG..',
    'GG......gggG...', 'ggG....gggG....', 'gggG..gggG.....', '.gggGgggG......',
    '..gggggG.......', '...gggG........', '....gG.........',
  ],
  cross: [
    'rr.........rr', 'rrr.......rrr', '.rrr.....rrr.', '..rrr...rrr..', '...rrr.rrr...',
    '....rrrrr....', '.....rrr.....', '....rrrrr....', '...rrr.rrr...', '..rrr...rrr..',
    '.rrr.....rrr.', 'rrr.......rrr', 'rr.........rr',
  ],
  bed: [
    '...............', '.nn............', '.nn............', '.nn............',
    '.nn.wwww.......', '.nnwwwwwbbbbbb.', '.nnwwwwwbbbbbb.', '.nnnbbbbbBbBbbB',
    '.nnnbbbbbbbbbbB', '.nnnBBBBBBBBBBB', '.nnnllllllllllll'.slice(0, 15), '.nnnnnnnnnnnnnn',
    '.nn.........nn.', '.nn.........nn.', '.NN.........NN.',
  ],
  toys: [
    '...nn.....nn...', '..nzzn...nzzn..', '..nzsn...nszn..', '...nzzzzzzzn...',
    '..nzzzzzzzzzn..', '.nzzzzzzzzzzzn.', '.nzzkzzzzzkzzn.', '.nzzzzzzzzzzzn.',
    '.nzzzzllllzzzn.', '.nzzzzllkllzzn.', '.nzzzzlllllzzn.', '..nzzzzrzzzzn..',
    '...nzzzzzzzn...',
  ],
  dishes: [
    '.........cc....', '........c..c...', '..cc.....cc....', '.c..c..........',
    '..cc.....cc....', '........c..c...', '..wwwwwwwwwww..', '.wbbbbbbbbbbbw.',
    '..aaaaaaaaaaa..', '..wwwwwwwwwww..', '.wbbbbbbbbbbbw.', '..aaaaaaaaaaa..',
    '..wwwwwwwwwww..', '.wwwwwwwwwwwww.', '..aaaaaaaaaaa..',
  ],
  trash: [
    '......aaa......', '....aaaaaaa....', '.aaaaaaaaaaaaa.', '.AAAAAAAAAAAAA.',
    '..aaaaaaaaaaa..', '..aAaaaAaaaAa..', '..aAaaaAaaaAa..', '..aAaaaAaaaAa..',
    '..aAaaaAaaaAa..', '..aAaaaAaaaAa..', '..aAaaaAaaaAa..', '..aAaaaAaaaAa..',
    '...aaaaaaaaa...', '...AAAAAAAAA...',
  ],
  laundry: [
    '....bbb..rrr...', '...bbbbbrrrrr..', '..bbbbbbrrrrr..', '.wwwwwwwwrrrr..',
    '.wwwwwwwwwwwww.', 'nnnnnnnnnnnnnnn', 'nNnNnNnNnNnNnNn', '.nnnnnnnnnnnnn.',
    '.nNnNnNnNnNnNn.', '.nnnnnnnnnnnnn.', '.nNnNnNnNnNnNn.', '..nnnnnnnnnnn..',
    '..NNNNNNNNNNN..',
  ],
  broom: [
    '............nn.', '...........nn..', '..........nn...', '.........nn....',
    '........nn.....', '.......nn......', '......ddd......', '....yyyydd.....',
    '...yyyyyddd....', '..yyoyyyodd.....'.slice(0, 15), '.yyyyoyyyod....', '.yoyyyoyyyo....',
    '.yoyyyoyyoo....', '.yy.yy.yy.y....',
  ],
  pet: [
    '...oo...oo.....'.replace('...oo...oo.....', '...oo....oo....'), '..oooo..oooo...', '..oooo..oooo...', '...oo....oo....',
    '.oo.........oo.', 'oooo..nn....oooo'.slice(0, 15), 'oooo.nnnnn..ooo', '.oo.nnnnnnn.oo.',
    '....nnnnnnn....', '...nnnnnnnnn...', '...nnnnnnnnn...', '...nnnNnnNnn...',
    '....nnn.nnn....',
  ],
  book: [
    '.RRrrrrrrrrrr..', '.RRrrrrrrrrrrl.', '.RRrrryyrrrrrl.', '.RRrryyyyrrrrl.',
    '.RRrrryyrrrrrl.', '.RRrrrrrrrrrrl.', '.RRrwwwwwwrrrl.', '.RRrrrrrrrrrrl.',
    '.RRrwwwwwrrrrl.', '.RRrrrrrrrrrrl.', '.RRrrrrrrrrrrl.', '.RRrrrrrrrrrrl.',
    '..lllllllllllll'.slice(0, 15),
  ],
  sparkle: raster((x, y) => star4(6, 8, 6, x, y) ? (star4(6, 8, 2, x, y) ? 'w' : x > 6 && y > 8 ? 'o' : 'y')
    : star4(11, 3, 3, x, y) ? (x === 11 && y === 3 ? 'w' : 'y') : null),
  moon: raster((x, y) => {
    const d1 = Math.hypot(x - 6, y - 7.5), d2 = Math.hypot(x - 9.5, y - 6);
    if (d1 <= 6.6 && d2 > 5.6) return d1 > 5 ? 'o' : 'y';
    return star4(12, 10, 2, x, y) ? (x === 12 && y === 10 ? 'w' : 'y') : null;
  }),
  gamepad: [
    '...............', '...............', '...............', '.LLLLLLLLLLLLL.',
    'PPPPPPPPPPPPPPP', 'PPPAPPPPPPPgPPP', 'PPAAAPPPPPbPrPP', 'PPPAPPPPPPPyPPP',
    'PPPPPPPPPPPPPPP', 'PPPPPPPPPPPPPPP', 'PPPPP.....PPPPP', '.PPPP.....PPPP.',
  ],
  tv: [
    '....a.....a....', '.....a...a.....', '......a.a......', '.nnnnnnnnnnnnn.',
    '.nbbbbbbbbbnnn.', '.nbcccbbbbbnyn.', '.nbcbbbbbbbnyn.', '.nbbbbbbbbbnnn.',
    '.nbbbbbbbbbnrn.', '.nbbbbbbbbbnrn.', '.nbbbbbbBBBnnn.', '.nnnnnnnnnnnnn.',
    '.NNNNNNNNNNNNN.', '..N.........N..',
  ],
  pizza: [
    '.oooooooooooooo', 'ooooooooooooooo', '.nnnnnnnnnnnnn.', '..yyyyyyyyyyy..',
    '..yyrryyyyyyy..', '...yrryyyyrry..', '...yyyyyyyrry..', '....yyrryyyy...',
    '....yrryyyyy...', '.....yyyyyy....', '.....yyyrry....', '......yyrry....',
    '......yyyy.....', '.......yy......',
  ],
  'ice-cream': [
    '......r.rr.....', '.....rrrr......', '....pppppp.....', '...pppppppp....',
    '..ppppwwppppp..', '..pppwpppppppp.'.slice(0, 15), '..pppppppppppp.'.slice(0, 15), '..lllllllllll..',
    '...lllllllll...', '...zzzzzzzzz...', '....zNzNzNz....', '....NzNzNzN....',
    '.....zNzNz.....', '......NzN......', '.......N.......',
  ],
  tree: [
    '....ggggggg....', '..ggggggggggg..', '.ggggwggggggGg.', '.gggwgggggggGg.',
    'ggggggggggrgggG', 'ggggggggggggggG', 'ggggrggggggggGG', '.ggggggggggggG.',
    '..GGgggggggGG..', '....GGGGGGG....', '......nnN......', '......nnN......',
    '......nnN......', '..ggg.nnN.ggg..', '.GGGGGNNNGGGGG.',
  ],
  movie: [
    '..KKwwKKwwKK...', '.KKwwKKwwKKw...', '.wwKKwwKKwwK...', 'KKKKKKKKKKKKKKK',
    'KwwwKKKKKKKKKKK', 'KKKKKKKKKKKKKKK'.replace(/^K{15}$/, 'KwwwwKwwwwKwwwK'), 'KKKKKKKKKKKKKKK', 'KwwwwwwKKKKKKKK',
    'KKKKKKKKKKKKKKK', 'KwwwwKwwwwwwKKK', 'KKKKKKKKKKKKKKK', 'KKKKKKKKKKKKKKK',
  ],
  gift: [
    '....yy...yy....', '...yyyy.yyyy...', '...yy.yyy.yy...', '....yyyyyyy....',
    '.rrrrryyyrrrrr.', '.rrrrryyyrrrrR.', '.rrrrryyyrrrrR.'.replace('.rrrrryyyrrrrR.', '..rrrryyyrrrR..'), '..rrrryyyrrrR..',
    '..rrrryyyrrrR..', '..rrrryyyrrrR..', '..rrrryyyrrrR..', '..rrrryyyrrrR..',
    '..rrrryyyrrrR..', '..RRRRyyyRRRR..',
  ],
  crown: [
    '...............', '.y.....y.....y.', '.yy...yyy...yy.', '.yyy..yyy..yyy.',
    '.yyyy.yyy.yyyy.', '.yyyyyyyyyyyyo.', '.yyyyyyyyyyyyo.', '.yybyyyryyybyo.',
    '.ddddddddddddd.', '.yyyyyyyyyyyyo.', '.ddddddddddddd.',
  ],
  candy: [
    '...............', '.....ppppp.....', '.bb.ppppppp.bb.', '.bbbpppppppbbb.',
    'bbbbpwpppppbbbb', 'bbbbppwppppbbbb', 'bbbbpppwpppbbbb', '.bbbpppwpppbbb.',
    '.bb.ppppppp.bb.', '.....ppppp.....',
  ],
};
ICONS.park = ICONS.tree;

// --- PNG writer ---
const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (b) => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (t, d) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(d.length);
  const td = Buffer.concat([Buffer.from(t), d]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

for (const [name, rows] of Object.entries(ICONS)) {
  // vertically centre the art in the 15-row box
  const grid = rows.map((r) => r.padEnd(15, '.'));
  if (grid.some((r) => r.length > 15) || grid.length > 15) throw new Error(`${name}: grid too big`);
  while (grid.length < 15) { grid.push('.'.repeat(15)); }
  const used = grid.map((r) => /[^.]/.test(r));
  const top = used.indexOf(true), bot = used.lastIndexOf(true);
  const art = grid.slice(top, bot + 1);
  const pad = 15 - art.length, before = Math.floor(pad / 2);
  const g = [...Array(before).fill('.'.repeat(15)), ...art, ...Array(pad - before).fill('.'.repeat(15))];
  const px = Array.from({ length: 32 }, () => Array(32).fill(null));
  for (let y = 0; y < 15; y++) for (let x = 0; x < 15; x++) {
    const ch = g[y][x]; if (ch === '.') continue;
    if (!P[ch]) throw new Error(`${name}: bad char ${ch}`);
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) px[y * 2 + dy + 1][x * 2 + dx + 1] = ch;
  }
  const out = px.map((r) => r.slice());
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    if (px[y][x]) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (px[y + dy]?.[x + dx]) out[y][x] = 'k';
  }
  const buf = Buffer.alloc(32 * 32 * 4);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const ch = out[y][x]; if (!ch) continue;
    const [r, gg, b] = hex(P[ch]); buf.set([r, gg, b, 255], (y * 32 + x) * 4);
  }
  writeFileSync(join(OUT, `${name}.png`), png(32, 32, buf));
}
console.log('wrote', Object.keys(ICONS).length, 'icons');
