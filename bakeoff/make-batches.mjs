// Every card with a drawing, for making them all puppets (bakeoff/recipe.md):
// its data, a suggested role and element (the agent confirms or changes
// them), the lane that does it, and batches of three per lane. Each lane owns
// whole drawing files (js/art/scenes/*.js), so two lanes never edit one file.
//   node bakeoff/make-batches.mjs   ->  bakeoff/cards.json, bakeoff/batches.json
import { readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const C = await import(pathToFileURL(join(ROOT, 'js', 'cards.js')).href);
const HOME = ['ashmaw', 'seraphine', 'the-barrow-queen']; // (done by hand: Home's fan)
const UPGRADE = ['lightning-theorist', 'shieldbearer', 'bone-lance']; // (made in the bake-off before the interaction contract: bring them up to it)
const LANES = {
  a: ['ember.js', 'verdant.js', 'tide.js', 'umbral.js', 'radiant.js', 'multi.js', 'new-a.js', 'new-b.js', 'champions.js', 'new-d.js', 'ultra-g.js'],
  b: ['new-c.js', 'ultra-a.js', 'ultra-b.js', 'ultra-c.js', 'ultra-d.js', 'ultra-e.js', 'ultra-f.js'],
};

const fileOf = {};
for (const f of readdirSync(join(ROOT, 'js', 'art', 'scenes')).filter((f) => f.endsWith('.js') && f !== 'shared.js')) {
  const m = await import(pathToFileURL(join(ROOT, 'js', 'art', 'scenes', f)).href);
  for (const v of Object.values(m)) if (v && typeof v === 'object') for (const id of Object.keys(v)) fileOf[id] = f;
}
const pool = new Map();
const add = (c, kind) => { if (c?.id && !pool.has(c.id)) pool.set(c.id, { ...c, kind }); };
for (const c of C.CARDS) add(c, 'card');
for (const c of C.ULTRA) add(c, 'ultra');
for (const c of Object.values(C.LEGENDS || {})) add(c, 'legend');
for (const c of Object.values(C.CHAMPIONS || {})) add(c, 'champion');
for (const [id, c] of Object.entries(C.TOKENS || {})) add({ id, ...c }, 'token');

// what it does in a fight (bakeoff/recipe.md, "Interactions")
function roleOf(c) {
  const kw = new Set(c.keywords || []), t = (c.text || '').toLowerCase();
  if (c.type === 'field' || c.type === 'relic') return 'aura';
  if (c.type === 'spell') {
    if (/(deal|deals) \d+ damage|destroy|loses? \d+ life|damage equal/.test(t)) return 'attacker';
    if (/shield|prevent|can't be|cannot be|return .* to (its|their) owner|protect|guard/.test(t)) return 'defender';
    return 'support';
  }
  if (['guard', 'shield', 'watchful', 'bodyguard'].some((k) => kw.has(k))) return 'defender';
  const p = c.power ?? 0, v = c.vitality ?? 0;
  if (['rush', 'venom', 'overrun', 'hunt', 'swift'].some((k) => kw.has(k)) || p >= v + 1) return 'attacker';
  if (v >= p + 2) return 'defender';
  if (/heal|draw a card|gain \d+ life|\+\d\/\+\d|create|give (a|another|your)/.test(t)) return 'support';
  return 'attacker';
}
// what its effects are made of, from what its picture shows (else its faction)
const ELEMENTS = [
  ['lightning', /lightning|thunder|\bbolt|crackl/], ['frost', /\bice\b|frost|snow|frozen|glacier|winter/], ['venom', /venom|poison|toxic|spore|ooze/],
  ['bone', /\bbones?\b|skelet|skull/], ['spirit', /ghost|spirit|wisp|phantom|\bsouls?\b|spectr/], ['blood', /blood/],
  ['fire', /fire|flame|ember|lava|burn|blaze|forge|furnace|pyre|cinder|kiln|volcan/],
  ['water', /\bwaves?\b|\bsea\b|water|\btide|ocean|bubble|whirlpool|drown|\brain\b|surf|pool|leviathan|\bfish/],
  ['wind', /wind|gale|feather|cloud|\bsky\b|\bbirds?\b|\bwings?\b|gull|kestrel/],
  ['nature', /\bvines?\b|\broots?\b|\bleaf|leaves|\btrees?\b|bloom|thorn|moss|forest|grove|flower|seed|fern|bark/],
  ['earth', /\bstones?\b|\brocks?\b|\bearth\b|mountain|boulder|\bwall\b|dust/],
  ['light', /\bsun|dawn|golden|\bgold\b|radiant|halo|\blight\b|candle|lantern/],
  ['shadow', /shadow|night|\bdark|\bmoon|violet|gloom|\bvoid\b|mist/],
  ['steel', /sword|blade|spear|arrow|shield|armou?r|lance|knight|soldier/],
  ['arcane', /\brunes?\b|spell|magic|scroll|\bbook|\bpages?\b|glyph/],
];
const FACTION_EL = { ember: 'fire', verdant: 'nature', tide: 'water', umbral: 'shadow', radiant: 'light' };
const elementOf = (c) => (ELEMENTS.find(([, re]) => re.test((c.art || '').toLowerCase()))?.[0]) || FACTION_EL[(c.factions || [])[0]] || 'arcane';

const cards = [];
for (const [lane, files] of Object.entries(LANES)) {
  for (const f of files) {
    for (const [id, file] of Object.entries(fileOf)) {
      if (file !== f || HOME.includes(id)) continue;
      const c = pool.get(id);
      cards.push({
        id, lane, file: `js/art/scenes/${f}`, name: c.name, kind: c.kind, type: c.type, subtype: c.subtype || '', factions: c.factions || [],
        power: c.power ?? null, vitality: c.vitality ?? null, keywords: c.keywords || [], text: c.text || '', art: c.art || '',
        role: roleOf(c), element: elementOf(c), upgrade: UPGRADE.includes(id),
      });
    }
  }
}
// batches of three, in each lane's file order; a lane's first batch mixes roles (a pilot)
const batches = [];
for (const lane of Object.keys(LANES)) {
  const list = cards.filter((c) => c.lane === lane).map((c) => c.id);
  const pilot = [];
  for (const want of ['attacker', 'defender', 'aura', 'support']) {
    const hit = cards.find((c) => c.lane === lane && c.role === want && !c.upgrade && !pilot.includes(c.id));
    if (hit && pilot.length < 3) pilot.push(hit.id);
  }
  const rest = list.filter((id) => !pilot.includes(id));
  const all = [pilot, ...Array.from({ length: Math.ceil(rest.length / 3) }, (_, i) => rest.slice(i * 3, i * 3 + 3))];
  all.forEach((ids, i) => batches.push({ lane, n: i + 1, ids }));
}
writeFileSync(join(ROOT, 'bakeoff', 'cards.json'), JSON.stringify(cards, null, 1));
writeFileSync(join(ROOT, 'bakeoff', 'batches.json'), JSON.stringify(batches, null, 1));
const count = (k) => Object.entries(cards.reduce((o, c) => ((o[c[k]] = (o[c[k]] || 0) + 1), o), {})).map(([a, b]) => `${a} ${b}`).join(', ');
console.log(`${cards.length} cards (${count('lane')}); ${batches.length} batches; roles: ${count('role')}; elements: ${count('element')}`);
