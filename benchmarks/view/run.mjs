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
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { buildHtmlReport } from '../lib/html-report.mjs';
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
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function runTarget(t, browser) {
	const context = await browser.newContext();
	const page = await context.newPage();
	page.on('pageerror', (e) => console.error(`  [${t.name}] page error:`, e.message));
	await page.goto(t.url, { waitUntil: 'load' });
	await page.waitForSelector(t.ready, { timeout: 15000 });
	await seedRandom(page);

	// Warmup — let JIT settle.
	for (let i = 0; i < 3; i++) {
		await page.evaluate(() => document.getElementById('run').click());
		await sleep(120);
		await page.evaluate(() => document.getElementById('clear').click());
		await sleep(80);
	}

	const results = {};
	for (const op of OPS) {
		const samples = [];
		for (let i = 0; i < ITER; i++) {
			await ensureState(page, op.pre);
			const dt = await timeClick(page, op.click);
			samples.push(dt);
			await sleep(50);
		}
		results[op.name] = summarizeSamples(samples);
	}

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
			row.push(`${r.median.toFixed(2)} (min ${r.min.toFixed(2)})`.padEnd(W));
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
				const ratio = scoreOf(r[op.name]) / scoreOf(baseline[op.name]);
				const tag = ratio < 0.95 ? '++ faster' : ratio < 1.05 ? '== ~equal' : '-- slower';
				console.log(`  ${op.name.padEnd(8)} ${ratio.toFixed(2)}x  ${tag}`);
			}
			console.log();
		}
	}
}

// ── Main ────────────────────────────────────────────────────────────────────

(async () => {
	const targetNames = TARGETS.map((t) => t.name);
	const children = await startServers();

	try {
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
			targets: targetNames.map((name) => ({
				name,
				ops: Object.fromEntries(
					Object.entries(all[name])
						.filter(([key]) => key !== '__dom')
						.map(([key, r]) => [key, timingStatForJson(r)]),
				),
				meta: { dom: all[name].__dom },
			})),
		};

		// Persist the run: machine-readable JSON + a self-contained HTML page
		// (linked to the other benchmark pages) in the shared results dir.
		fs.mkdirSync(RESULTS_DIR, { recursive: true });
		const jsonPath = path.join(RESULTS_DIR, 'view.json');
		fs.writeFileSync(jsonPath, JSON.stringify(payload, null, '\t') + '\n');
		const htmlPath = path.join(RESULTS_DIR, 'view.html');
		fs.writeFileSync(htmlPath, buildViewHtml(payload));
		console.error(`results written to ${path.relative(REPO_ROOT, RESULTS_DIR)}/view.{json,html}`);

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
})().catch((e) => {
	console.error(e);
	process.exit(1);
});

// ── HTML report ─────────────────────────────────────────────────────────────

function buildViewHtml(payload) {
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

	return buildHtmlReport({
		suite: 'view',
		title: 'view benchmarks — keyed 1,000-row table',
		note: `score = steady-window mean, ${payload.iterations} samples per op · green = best in row`,
		columns: names,
		baseline,
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
							names.map((name) => [name, targets.find((t) => t.name === name).ops[op.name]?.score]),
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
