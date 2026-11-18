// Client-side benchmark: drives the krausest js-framework-benchmark ops
// against torpor / react / solid / svelte / vue fixtures via Playwright, and
// prints a comparison table.
//
// Adapted from ~/Source/torpor-bench/benchmarks/js-framework (trimmed to the
// core 9 ops so a full run stays around a minute).
//
// Usage:
//   pnpm bench              # from benchmarks/view
//   node run.mjs 8          # more iterations per op (default 5)
//   TARGETS='["torpor","vue"]' node run.mjs   # subset (fixtures auto-start)
//
// The runner starts each fixture's vite dev server itself (production mode —
// see fixtures/*/vite.config.js) and kills them on exit.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { buildHtmlReport, speedOrderedColumns, writeRunResults } from '../lib/html-report.mjs';
import { censusDomNodes, deterministicCount } from './lib/dom-nodes.mjs';
import { scoreOf, summarizeSamples } from './lib/stats.mjs';

const ITER = parseInt(process.argv[2] || process.env.ITER || '5', 10);
const ROW_COUNT = 1000;
const ROW_COUNT_LARGE = 10000; // matches the canonical suite's runlots / clear size

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');
const RESULTS_DIR = path.join(HERE, '..', 'results');

// One dev server per fixture, each on its own fixed port (see the fixtures'
// vite.config.js — the runner must agree with them).
const FIXTURES = {
	torpor: { fixture: 'torpor', port: 5483 },
	react: { fixture: 'react', port: 5475 },
	solid: { fixture: 'solid', port: 5479 },
	vue: { fixture: 'vue', port: 5480 },
	svelte: { fixture: 'svelte', port: 5491 },
};

// TARGETS can name fixtures (auto-started on their fixed ports) or pass an
// explicit {name,url,ready} for an already-running server.
const TARGETS = (
	process.env.TARGETS
		? JSON.parse(process.env.TARGETS).map((t) => {
				const name = typeof t === 'string' ? t : t.name;
				const fixture = FIXTURES[name];
				if (fixture) return { name, url: `http://localhost:${fixture.port}/`, ready: '#run' };
				return typeof t === 'string' ? null : { url: undefined, ...t };
			})
		: Object.entries(FIXTURES).map(([name, f]) => ({
				name,
				url: `http://localhost:${f.port}/`,
				ready: '#run',
			}))
).filter((t) => t && t.url);

const OPS = [
	{ name: 'run', pre: 'empty', click: '#run' },
	{ name: 'replace', pre: 'rows', click: '#run' },
	// Canonical krausest "append 1,000 rows to a table of 1,000 rows".
	{ name: 'add', pre: 'rows', click: '#add' },
	{ name: 'update', pre: 'rows', click: '#update' },
	{ name: 'select', pre: 'rows', click: 'tbody tr:nth-child(5) td:nth-child(2) a' },
	{ name: 'swap', pre: 'rows', click: '#swaprows' },
	{ name: 'remove', pre: 'rows', click: 'tbody tr:nth-child(5) td:nth-child(3) a' },
	{ name: 'runlots', pre: 'empty', click: '#runlots' },
	// Canonical `clear` measures clearing the 10K-row table that `runlots`
	// populated. `rows-large` ensures the 10K state first.
	{ name: 'clear', pre: 'rows-large', click: '#clear' },
	// ── Keyed-reorder matrix (adapted from torpor-bench's run-reorder.mjs).
	// Most reorder ops sit far below performance.now()'s resolution (a rotate
	// is ~1 DOM move), so each timed sample loops REPS clicks inside the
	// window and divides: REPS=100 for the guarded rotate pair, REPS=20 for
	// displace_k / remove*, REPS=4 for reverse + shuffle (reverse is
	// self-inverse and shuffle reseeds per click, so repeated clicks are
	// valid, comparable work). The 100-row insert ops time with one click.
	// Each sample starts from a fresh 1k `#run` (outside the timed window).
	//
	// The shuffle op advances a seeded stream ONCE per click, replayed by the
	// identity gate to verify DOM order — a fast reorder that recreates rows
	// or misorders them fails the gate and is reported as `null`.
	{ name: 'reverse', pre: 'rows', click: '#reverse', reps: 4, gate: 'reverse' },
	{ name: 'shuffle', pre: 'rows', click: '#shuffle', reps: 4, gate: 'shuffle' },
	{ name: 'rotatef', pre: 'rows', click: '#rotatef', reps: 100, gate: 'rotatef' },
	{ name: 'rotateb', pre: 'rows', click: '#rotateb', reps: 100, gate: 'rotateb' },
	{ name: 'prepend100', pre: 'rows', click: '#prepend100', reps: 1, gate: 'prepend100' },
	{ name: 'append100', pre: 'rows', click: '#append100', reps: 1, gate: 'append100' },
	{ name: 'insertmid100', pre: 'rows', click: '#insertmid100', reps: 1, gate: 'insertmid100' },
	{ name: 'removefirst', pre: 'rows', click: '#removefirst', reps: 20, gate: 'removefirst' },
	{ name: 'removeevery10', pre: 'rows', click: '#removeevery10', reps: 20, gate: 'removeevery10' },
	{ name: 'displace3', pre: 'rows', click: '#displace3', reps: 20, gate: 'displace3' },
];

// Reorder-gate sentinel for "a freshly-built row goes here" in expected
// permutations. Row ids are numeric strings, so this can never collide.
const GATE_NEW = '<new>';
const gateFill100 = () => new Array(100).fill(GATE_NEW);

// Fixture-shared shuffle machinery, replayed for the identity gate:
// byte-for-byte the algorithm in each fixture — a module-level mulberry32
// stream (fixed seed 42) yields one 32-bit seed per #shuffle click, and
// Fisher–Yates runs on a PRNG seeded by it. Each target gets a fresh page
// load (fresh module state), so a fresh stream here stays in lockstep as
// long as the harness counts every #shuffle click it fires.
function mulberry32(seed) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const SHUFFLE_SEED = 42;
function shuffleWithSeed(d, seed) {
	const rand = mulberry32(seed);
	const out = d.slice();
	for (let i = out.length - 1; i > 0; i--) {
		const j = (rand() * (i + 1)) | 0;
		const tmp = out[i];
		out[i] = out[j];
		out[j] = tmp;
	}
	return out;
}

// Expected permutation for each gate op — replays the op on the pre-click
// id list. `NEW` marks "a freshly-built row goes here".
const GATE_EXPECTED = {
	reverse: (pre) => pre.slice().reverse(),
	shuffle: (pre, ctx) => shuffleWithSeed(pre, ctx.nextSeed()),
	rotatef: (pre) => [pre[pre.length - 1], ...pre.slice(0, -1)],
	rotateb: (pre) => [...pre.slice(1), pre[0]],
	prepend100: (pre) => gateFill100().concat(pre),
	append100: (pre) => pre.concat(gateFill100()),
	insertmid100: (pre) => {
		const mid = pre.length >> 1;
		return pre.slice(0, mid).concat(gateFill100(), pre.slice(mid));
	},
	removefirst: (pre) => pre.slice(1),
	removeevery10: (pre) => pre.filter((_, i) => i % 10 !== 0),
	displace3: (pre) => pre.slice(3).concat(pre.slice(0, 3)),
};

// Reset to a fresh 1k table (each reorder timed sample starts here).
async function resetRows(page) {
	const cnt = await page.evaluate(async () => {
		document.getElementById('run').click();
		if (window.__benchFlush) await window.__benchFlush();
		return document.querySelectorAll('tbody tr').length;
	});
	if (cnt !== ROW_COUNT) {
		throw new Error(`reset: expected ${ROW_COUNT} rows after #run, got ${cnt}`);
	}
}

// Identity gate (uibench-style), run ONCE per gate op OUTSIDE the timed
// loop: before the op the harness stamps every <tr> AND every element
// inside it with an expando (`__benchId = <row id>`); after one click it
// asserts that (a) every surviving row id appears at the position the
// replayed op predicts, (b) each surviving <tr> is the SAME node as before
// (its stamp still matches), (c) every cell inside a surviving <tr> is also
// the same node (no stampless, rebuilt children — moving the <tr> while
// re-creating its contents fails), and (d) freshly-built rows use brand-new
// ids on all-new nodes. Throws on any mismatch; the caller records the fail
// and skips the op's timing.
async function identityGate(page, op, ctx, targetName) {
	await resetRows(page);
	const preIds = await page.evaluate(() => {
		const out = [];
		for (const tr of document.querySelectorAll('tbody tr')) {
			const id = tr.firstElementChild.textContent;
			tr.__benchId = id;
			for (const el of tr.querySelectorAll('*')) el.__benchId = id;
			out.push(id);
		}
		return out;
	});
	if (preIds.length !== ROW_COUNT) {
		throw new Error(`[${targetName}/${op.name}] identity gate: bad pre state (${preIds.length})`);
	}
	const expected = GATE_EXPECTED[op.gate](preIds, ctx);
	const post = await page.evaluate(async (sel) => {
		document.querySelector(sel).click();
		if (window.__benchFlush) await window.__benchFlush();
		return Array.from(document.querySelectorAll('tbody tr'), (tr) => {
			const stamp = typeof tr.__benchId === 'string' ? tr.__benchId : null;
			let mismatched = 0;
			let unstamped = 0;
			for (const el of tr.querySelectorAll('*')) {
				const s = el.__benchId;
				if (s === undefined) unstamped++;
				else if (s !== stamp) mismatched++;
			}
			return { id: tr.firstElementChild.textContent, stamp, mismatched, unstamped };
		});
	}, op.click);

	const fail = (msg) => {
		throw new Error(`[${targetName}/${op.name}] identity gate FAILED: ${msg}`);
	};
	if (post.length !== expected.length) {
		fail(`row count ${post.length}, expected ${expected.length}`);
	}
	const preSet = new Set(preIds);
	const seenNew = new Set();
	for (let i = 0; i < expected.length; i++) {
		const want = expected[i];
		const got = post[i];
		if (want === GATE_NEW) {
			// Freshly-built row: brand-new id on an all-new node subtree.
			if (preSet.has(got.id)) fail(`position ${i}: expected a new row, got surviving id ${got.id}`);
			if (seenNew.has(got.id)) fail(`position ${i}: duplicate new id ${got.id}`);
			seenNew.add(got.id);
			if (got.stamp !== null) {
				fail(`position ${i}: new row ${got.id} reused a pre-existing <tr> (stamp ${got.stamp})`);
			}
			if (got.mismatched !== 0) {
				fail(`position ${i}: new row ${got.id} contains ${got.mismatched} foreign stamped node(s)`);
			}
		} else {
			// Survivor: right id in the right place, on the SAME node as
			// before — the <tr> itself and every element inside it.
			if (got.id !== want) fail(`position ${i}: id ${got.id}, expected ${want} (order mismatch)`);
			if (got.stamp !== want) {
				fail(
					`position ${i}: id ${want} is on a ${got.stamp === null ? 'REBUILT' : 'foreign'} <tr>` +
						` (stamp ${got.stamp}) — survivor node identity lost`,
				);
			}
			if (got.unstamped !== 0) {
				fail(`position ${i}: row ${want} has ${got.unstamped} rebuilt node(s) — cells were re-created, not moved`);
			}
			if (got.mismatched !== 0) {
				fail(`position ${i}: row ${want} contains ${got.mismatched} node(s) from other rows`);
			}
		}
	}
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Framework versions ──────────────────────────────────────────────────────

// The packages whose versions define each fixture, resolved from the
// benchmarks workspace's node_modules (hoisted deps) or the workspace
// package sources for torpor itself.
const VERSION_PACKAGES = {
	torpor: ['@torpor/view'],
	react: ['react', 'react-dom'],
	solid: ['solid-js'],
	vue: ['vue'],
	svelte: ['svelte'],
};

function resolveVersions(targetNames) {
	const versions = {};
	for (const name of targetNames) {
		versions[name] = {};
		for (const pkg of VERSION_PACKAGES[name] ?? []) {
			let v;
			try {
				v = JSON.parse(
					fs.readFileSync(path.join(HERE, 'node_modules', pkg, 'package.json'), 'utf8'),
				).version;
			} catch {
				try {
					v = JSON.parse(
						fs.readFileSync(
							path.join(REPO_ROOT, 'packages', pkg.replace('@torpor/', ''), 'package.json'),
							'utf8',
						),
					).version;
				} catch {
					// not installed — leave undefined
				}
			}
			versions[name][pkg] = v ?? 'unknown';
		}
	}
	return versions;
}

function versionLine(versions, targetNames) {
	return targetNames
		.map((n) =>
			Object.entries(versions[n] ?? {})
				.map(([p, v]) => `${p}@${v}`)
				.join(' + '),
		)
		.join(' · ');
}

// Per-target identity-gate summary: "pass" when every reorder op held, else
// "fail: <op>[, <op>…]" listing exactly which ops broke node identity.
function gateSummary(gateFails) {
	const failed = Object.keys(gateFails ?? {});
	return failed.length ? `fail: ${failed.join(', ')}` : 'pass';
}

// ── README results section ──────────────────────────────────────────────────

// Rewrites the marker-bounded "Latest results" section of
// benchmarks/README.md after every run, so the checked-in README always
// shows the most recent comparison.
const README_START = '<!-- results:auto -->';
const README_END = '<!-- /results:auto -->';

export function updateReadmeResults(payload, readmePath) {
	const names = payload.targets.map((t) => t.name);
	const baseline = names.includes('torpor') ? 'torpor' : names[0];
	const baselineOps = payload.targets.find((t) => t.name === baseline).ops;
	// Reference-weighted geometric mean vs the baseline (same weighting as
	// the HTML report's total row; 1.00 = baseline). Gate-failed ops carry
	// null scores and are excluded from the weighting — as are ops missing
	// from any target.
	const opNames = Object.keys(baselineOps).filter(
		(opName) =>
			baselineOps[opName]?.score !== undefined &&
			payload.targets.every((t) => typeof t.ops[opName]?.score === 'number' && t.ops[opName].score > 0),
	);

	// Reference-weighted geometric mean vs the baseline (same weighting as
	// the HTML report's total row; 1.00 = baseline).
	const totals = Object.fromEntries(
		payload.targets.map((t) => {
			let weightedLogSum = 0;
			let weightSum = 0;
			for (const opName of opNames) {
				const s = t.ops[opName]?.score;
				const base = baselineOps[opName]?.score;
				if (typeof s === 'number' && s > 0 && base > 0) {
					weightedLogSum += base * Math.log(s / base);
					weightSum += base;
				}
			}
			return [t.name, weightSum > 0 ? Math.exp(weightedLogSum / weightSum) : NaN];
		}),
	);

	// Table columns read fastest → slowest by the total, torpor (the
	// baseline) pinned first
	const columns = speedOrderedColumns(names, totals, { baseline, lowerIsBetter: true });

	const best = (opName) => {
		let bestName = null;
		let bestV = Infinity;
		for (const t of payload.targets) {
			const v = t.ops[opName]?.score;
			if (typeof v === 'number' && v < bestV) {
				bestV = v;
				bestName = t.name;
			}
		}
		return bestName;
	};

	const fmt = (v) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v >= 1 ? v.toFixed(2) : v.toFixed(3));
	const cell = (tName, opName) => {
		const v = payload.targets.find((t) => t.name === tName).ops[opName]?.score;
		if (typeof v !== 'number') return '—';
		const text = fmt(v);
		return best(opName) === tName ? `**${text}**` : text;
	};
	const totalCell = (tName) => {
		const v = totals[tName];
		const text = `${fmt(v)}×`;
		return bestTotal() === tName ? `**${text}**` : text;
	};
	const bestTotal = () => {
		let bestName = null;
		let bestV = Infinity;
		for (const t of payload.targets) {
			const v = totals[t.name];
			if (typeof v === 'number' && v < bestV) {
				bestV = v;
				bestName = t.name;
			}
		}
		return bestName;
	};

	const table = [
		`| op (ms · lower is better) | ${columns.map((n) => n.padEnd(7)).join(' | ')} |`,
		`|---|${columns.map(() => '---:').join('|')}|`,
		...opNames.map((opName) =>
			`| ${opName.padEnd(9)} | ${columns.map((n) => cell(n, opName).padEnd(7)).join(' | ')} |`,
		),
		`| **total (geo vs ${baseline})** | ${columns.map((n) => totalCell(n).padEnd(7)).join(' | ')} |`,
	].join('\n');

	const generated = new Date(payload.generatedAt);
	const section = [
		README_START,
		'',
		'## Latest results',
		'',
		`${generated.toISOString().replace('T', ' ').slice(0, 16)} UTC · interactive report: [view.html](./results/view.html) · archive: [view-${payload.generatedAt ? '' : ''}…]`,
		'',
		`Versions: ${versionLine(payload.versions, columns)}`,
		'',
		table,
		'',
		`Totals are reference-weighted geometric means vs ${baseline} (1.00 = baseline). Best per row in bold.`,
		'',
		README_END,
	].join('\n');

	let readme = fs.readFileSync(readmePath, 'utf8');
	const startIdx = readme.indexOf(README_START);
	const endIdx = readme.indexOf(README_END);
	if (startIdx !== -1 && endIdx !== -1) {
		const rest = readme.slice(endIdx + README_END.length);
		// The replaced section is newline-terminated unless the text after the
		// marker already starts with one (otherwise the file grows a trailing
		// newline on every run)
		readme = readme.slice(0, startIdx) + section + (rest.startsWith('\n') ? '' : '\n') + rest;
	} else {
		readme = readme.trimEnd() + '\n\n' + section + '\n';
	}
	fs.writeFileSync(readmePath, readme);
	console.error(`README results section updated in ${path.relative(REPO_ROOT, readmePath)}`);
}

// ── Dev server management ───────────────────────────────────────────────────

function vpBin() {
	const bin = path.join(HERE, 'node_modules', '.bin', 'vp');
	if (fs.existsSync(bin)) return bin;
	return 'vp';
}

async function waitForServer(url, timeoutMs = 60_000) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const res = await fetch(url);
			if (res.ok) return;
		} catch {
			// not up yet
		}
		await sleep(250);
	}
	throw new Error(`server at ${url} did not start in ${timeoutMs}ms`);
}

async function startServers() {
	const children = [];
	for (const t of TARGETS) {
		const f = FIXTURES[t.name];
		if (!f) continue; // externally-provided target
		const fixtureDir = path.join(HERE, 'fixtures', f.fixture);
		const child = spawn(vpBin(), ['dev', '--port', String(f.port), '--strictPort'], {
			cwd: fixtureDir,
			// The vite `mode: 'production'` in each fixture's config controls
			// `define` replacement, but NOT how the framework plugins pick
			// their variants: plugin-react chooses jsx-dev-runtime and solid
			// resolves dist/dev.js from the actual NODE_ENV. Without this,
			// react/solid silently run dev-mode runtimes (audited via the
			// served module graph — see the README's methodology note).
			env: { ...process.env, NODE_ENV: 'production' },
			stdio: 'ignore',
		});
		children.push(child);
		await waitForServer(t.url);
		console.error(`  ${t.name} ready on :${f.port}`);
	}
	return children;
}

function stopServers(children) {
	for (const child of children) {
		try {
			child.kill('SIGTERM');
		} catch {
			// already gone
		}
	}
}

// ── Measurement (same protocol as the torpor-bench harness) ─────────────────

// Use the same data stream for every target. Label generation is inside the
// measured create operations, so uncontrolled randomness would add noise
// through different string lengths and allocation patterns.
const seedRandom = (page) =>
	page.evaluate(() => {
		let state = 0x5eed5eed >>> 0;
		Math.random = () => {
			state = (state + 0x6d2b79f5) | 0;
			let value = Math.imul(state ^ (state >>> 15), 1 | state);
			value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
			return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
		};
	});

async function ensureState(page, pre) {
	if (pre === 'empty') {
		await page.evaluate(() => {
			const btn = document.getElementById('clear');
			if (btn) btn.click();
		});
		await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 0, {
			timeout: 5000,
		});
	} else if (pre === 'rows') {
		const cnt = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
		if (cnt !== ROW_COUNT) {
			await page.evaluate(() => document.getElementById('run').click());
			await page.waitForFunction(
				(n) => document.querySelectorAll('tbody tr').length === n,
				ROW_COUNT,
				{ timeout: 10000 },
			);
		}
	} else if (pre === 'rows-large') {
		const cnt = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
		if (cnt !== ROW_COUNT_LARGE) {
			await page.evaluate(() => document.getElementById('runlots').click());
			await page.waitForFunction(
				(n) => document.querySelectorAll('tbody tr').length === n,
				ROW_COUNT_LARGE,
				{ timeout: 20000 },
			);
		}
	}
	await sleep(20);
}

// Time ONLY the click handler's commit. Targets either commit synchronously on
// click (react/svelte flushSync, solid flush, torpor) or expose
// `window.__benchFlush = () => <promise resolving once the scheduler has
// flushed>` (vue); the timed window then extends until that promise settles.
async function timeClick(page, sel) {
	return await page.evaluate(async (sel) => {
		const el = document.querySelector(sel);
		if (!el) throw new Error('selector not found: ' + sel);
		const flush = window.__benchFlush;
		(window.gc || (() => {}))();
		const t0 = performance.now();
		el.click();
		if (flush) await flush();
		return performance.now() - t0;
	}, sel);
}

// Timed sample for the reorder ops: REPS clicks inside one
// performance.now() window, divided — most reorder ops sit far below
// performance.now()'s resolution, so a single click quantizes to the timer
// floor. gc() immediately before keeps a surprise collection out of the
// window. Async-commit targets (window.__benchFlush) await the scheduler
// flush BETWEEN clicks: without it the REPS state changes would coalesce
// into one commit and the sample would time a single net permutation
// instead of REPS full commits.
async function timeSample(page, sel, reps) {
	return await page.evaluate(
		async ({ sel, reps }) => {
			const el = document.querySelector(sel);
			if (!el) throw new Error('selector not found: ' + sel);
			const flush = window.__benchFlush;
			(window.gc || (() => {}))();
			const t0 = performance.now();
			if (flush) {
				for (let k = 0; k < reps; k++) {
					el.click();
					await flush();
				}
			} else {
				for (let k = 0; k < reps; k++) el.click();
			}
			return (performance.now() - t0) / reps;
		},
		{ sel, reps },
	);
}

async function runTarget(t, browser) {
	const context = await browser.newContext();
	const page = await context.newPage();
	page.on('pageerror', (e) => console.error(`  [${t.name}] page error:`, e.message));
	await page.goto(t.url, { waitUntil: 'load' });
	await page.waitForSelector(t.ready, { timeout: 15000 });
	await page.waitForSelector('#reverse', { timeout: 15000 }).catch(() => {});
	await seedRandom(page);

	// Fresh page load ⇒ the fixture's module-level shuffle stream is at its
	// start. Mirror it, advancing once per #shuffle click the harness fires.
	const stream = mulberry32(SHUFFLE_SEED);
	const gateCtx = { nextSeed: () => (stream() * 4294967296) >>> 0 };

	// Warmup — let JIT settle.
	for (let i = 0; i < 3; i++) {
		await page.evaluate(() => document.getElementById('run').click());
		await sleep(120);
		await page.evaluate(() => document.getElementById('clear').click());
		await sleep(80);
	}

	const results = {};
	const gateFails = {};
	for (const op of OPS) {
		if (op.gate) {
			// Reorder op: correctness first, once, outside any timed window.
			// A gate failure is a per-(target, op) fact — record it, skip the
			// timing (its DOM is wrong, so any number would be garbage), and
			// keep going so the other targets/ops still produce a full
			// matrix. Timing each sample starts from a fresh 1k `#run`; REPS
			// clicks inside one performance.now() window, divided. The
			// shuffle op advances the seeded stream once per click — the
			// harness advances its replayed stream to stay in lockstep.
			try {
				await identityGate(page, op, gateCtx, t.name);
			} catch (e) {
				const msg = String(e && e.message ? e.message : e);
				gateFails[op.name] = msg;
				results[op.name] = null;
				console.error(`  ⚠ GATE FAIL ${t.name}/${op.name}: ${msg}`);
				continue;
			}
			const samples = [];
			const reps = op.reps ?? 1;
			for (let i = 0; i < ITER; i++) {
				await resetRows(page);
				const dt = await timeSample(page, op.click, reps);
				if (op.gate === 'shuffle') {
					for (let k = 0; k < reps; k++) stream();
				}
				samples.push(dt);
				await sleep(20);
			}
			results[op.name] = summarizeSamples(samples);
		} else {
			const samples = [];
			for (let i = 0; i < ITER; i++) {
				await ensureState(page, op.pre);
				const dt = await timeClick(page, op.click);
				samples.push(dt);
				await sleep(50);
			}
			results[op.name] = summarizeSamples(samples);
		}
	}
	results.__gateFails = gateFails;

	// Steady-state DOM shape at 1K rows (element/text/comment counts must be
	// comparable across frameworks).
	await ensureState(page, 'rows');
	const dom = await page.evaluate(censusDomNodes, '#main');
	results.nodes_1k = deterministicCount(dom.total);
	results.elements_1k = deterministicCount(dom.elements);
	results.text_1k = deterministicCount(dom.text);
	results.comments_1k = deterministicCount(dom.comments);
	results.__dom = dom;

	await context.close();
	return results;
}

// ── Report ──────────────────────────────────────────────────────────────────

function printReport(all, targetNames) {
	const cols = targetNames;
	const W = 24;
	console.log();
	console.log('Op       | ' + cols.map((c) => c.padEnd(W)).join('| '));
	console.log('---------+-' + cols.map(() => '-'.repeat(W)).join('+-'));
	for (const op of OPS) {
		const row = [op.name.padEnd(8)];
		for (const c of cols) {
			const r = all[c][op.name];
			row.push(r === null ? 'GATE FAIL'.padEnd(W) : `${r.median.toFixed(2)} (min ${r.min.toFixed(2)})`.padEnd(W));
		}
		console.log(row.join('| '));
	}
	for (const [label, key] of [
		['#nodes', 'nodes_1k'],
		['#elems', 'elements_1k'],
		['#text', 'text_1k'],
		['#cmnts', 'comments_1k'],
	]) {
		const row = [label.padEnd(8)];
		for (const c of cols) row.push(String(all[c][key].median).padEnd(W));
		console.log(row.join('| '));
	}

	// Ratios vs torpor (falling back to the first target when torpor isn't run).
	if (targetNames.length > 1) {
		const baselineName = targetNames.includes('torpor') ? 'torpor' : targetNames[0];
		const baseline = all[baselineName];
		console.log();
		for (const name of targetNames) {
			if (name === baselineName) continue;
			const r = all[name];
			console.log(`${name} / ${baselineName} ratio (score; <1 means ${name} faster):`);
			for (const op of OPS) {
				const rv = r[op.name];
				if (rv === null) {
					console.log(`  ${op.name.padEnd(8)} GATE FAIL`);
					continue;
				}
				const ratio = scoreOf(rv) / scoreOf(baseline[op.name]);
				const tag = ratio < 0.95 ? '++ faster' : ratio < 1.05 ? '== ~equal' : '-- slower';
				console.log(`  ${op.name.padEnd(8)} ${ratio.toFixed(2)}x  ${tag}`);
			}
			const gate = gateSummary(r.__gateFails);
			if (gate !== 'pass') console.log(`  identity gate: ${gate}`);
			console.log();
		}
	}
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
	const targetNames = TARGETS.map((t) => t.name);
	const versions = resolveVersions(targetNames);
	const children = await startServers();

	try {
		console.log();
		console.log(`Versions: ${versionLine(versions, targetNames)}`);

		const browser = await chromium.launch({
			headless: true,
			args: ['--disable-extensions', '--js-flags=--expose-gc'],
		});

		const all = {};
		for (const t of TARGETS) {
			console.error(`Running ${t.name} (${t.url}) × ${ITER}…`);
			all[t.name] = await runTarget(t, browser);
		}
		await browser.close();

		printReport(all, targetNames);

		const payload = {
			suite: 'view',
			iterations: ITER,
			versions,
			targets: targetNames.map((name) => ({
				name,
				versions: versions[name],
				ops: Object.fromEntries(
					Object.entries(all[name])
						.filter(([key]) => key !== '__dom' && key !== '__gateFails')
						.map(([key, r]) => [key, r === null ? null : timingStatForJson(r)]),
				),
				meta: {
					dom: all[name].__dom,
					identityGate: gateSummary(all[name].__gateFails),
				},
			})),
		};

		// Persist the run: machine-readable JSON + a self-contained HTML page
		// (linked to the previous/next runs and the other suite) in the shared
		// results dir
		const result = writeRunResults({
			suite: 'view',
			payload,
			resultsDir: RESULTS_DIR,
			renderHtml: buildViewHtml,
		});
		console.error(
			`results written to ${path.relative(REPO_ROOT, RESULTS_DIR)}/view.html (archive view-${result.timestamp}.html)`,
		);
		updateReadmeResults(payload, path.join(REPO_ROOT, 'benchmarks', 'README.md'));

		if (process.env.BENCH_JSON) {
			fs.writeFileSync(
				process.env.BENCH_JSON,
				JSON.stringify(payload, null, '\t') + '\n',
			);
			console.error(`BENCH_JSON written to ${process.env.BENCH_JSON}`);
		}
	} finally {
		stopServers(children);
	}
}

// Run the benchmark only when this file is the entry point — the HTML/README
// builders are importable for regenerating result pages without a full run.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().catch((e) => {
		console.error(e);
		process.exit(1);
	});
}

// ── HTML report ─────────────────────────────────────────────────────────────

export function buildViewHtml(payload, { prevRun, nextRun } = {}) {
	const targets = payload.targets;
	const names = targets.map((t) => t.name);
	const baseline = names.includes('torpor') ? 'torpor' : names[0];
	const baselineOps = targets.find((t) => t.name === baseline).ops;

	// Total row: reference-time-weighted geometric mean of per-op scores vs the
	// baseline (baseline reads exactly 1; <1 faster overall, >1 slower).
	const total = Object.fromEntries(
		names.map((name) => {
			const ops = targets.find((t) => t.name === name).ops;
			let weightedLogSum = 0;
			let weightSum = 0;
			for (const op of OPS) {
				const s = ops[op.name]?.score;
				const base = baselineOps[op.name]?.score;
				if (typeof s === 'number' && s > 0 && typeof base === 'number' && base > 0) {
					weightedLogSum += base * Math.log(s / base);
					weightSum += base;
				}
			}
			return [name, weightSum > 0 ? Math.exp(weightedLogSum / weightSum) : NaN];
		}),
	);

	// Columns read fastest → slowest by the total, torpor (the baseline)
	// pinned first
	const columns = speedOrderedColumns(names, total, { baseline, lowerIsBetter: true });
	const versionNote = columns
		.map(
			(n) =>
				`${n}: ${Object.entries(payload.versions?.[n] ?? {})
					.map(([p, v]) => `${p} ${v}`)
					.join(', ')}`,
		)
		.join(' · ');

	return buildHtmlReport({
		suite: 'view',
		title: 'view benchmarks — keyed 1,000-row table',
		note: [
			`score = steady-window mean, ${payload.iterations} samples per op · green = best in row`,
			versionNote,
		],
		columns,
		baseline,
		generatedAt: payload.generatedAt,
		prevRun,
		nextRun,
		sections: [
			{
				heading: 'timing',
				unit: 'ms · lower is better',
				lowerIsBetter: true,
				format: 'ms',
				rows: [
					...OPS.map((op) => ({
						op: op.name,
						values: Object.fromEntries(
							names.map((name) => [name, targets.find((t) => t.name === name).ops[op.name]?.score ?? null]),
						),
					})),
					{ op: 'total', total: true, format: 'ratio', values: total },
				],
			},
			{
				heading: 'DOM census at 1K rows',
				unit: 'deterministic node counts',
				lowerIsBetter: true,
				format: 'count',
				rows: ['nodes_1k', 'elements_1k', 'text_1k', 'comments_1k'].map((key) => ({
					op: key.replace(/_1k$/, ''),
					values: Object.fromEntries(
						names.map((name) => [
							name,
							targets.find((t) => t.name === name).ops[key]?.median,
						]),
					),
				})),
			},
		],
	});
}

// Local import to keep the JSON payload shape identical to the torpor-bench
// suite without exporting stats internals from lib/stats.mjs.
function timingStatForJson(stat) {
	return {
		score: stat.score,
		median: stat.median,
		min: stat.min,
		mean: stat.mean,
		p95: stat.p95,
		sd: stat.sd ?? stat.stddev,
		rme: stat.rme,
		scoreRme: stat.scoreRme,
		warmupRatio: stat.warmupRatio,
		samples: stat.samples,
	};
}
