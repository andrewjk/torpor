// Server-side benchmark: starts each framework's HTTP server on 127.0.0.1,
// drives the same route contract with autocannon, and prints a req/sec +
// latency comparison table.
//
// Frameworks under test: torpor (@torpor/build), express, hono, fastify,
// elysia. Adapted from ~/Source/benchmarks/hono/benchmarks/fetch (route
// contract) and ~/Source/benchmarks/bun-http-framework-benchmark (real-HTTP
// autocannon methodology), trimmed so a full run finishes in well under a
// minute:
//
//   pnpm bench                      # 1s per case, 100 connections
//   DURATION=5 pnpm bench           # longer, less noisy runs
//   FRAMEWORKS=torpor,hono pnpm bench
//   CASE=query pnpm bench
//
// The torpor fixture is built once with `tb --build` (skipped when
// servers/torpor/dist is fresh; use --rebuild to force).

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import autocannon from 'autocannon';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOST = '127.0.0.1';
const DURATION = parseFloat(process.env.DURATION || '1');
const CONNECTIONS = parseInt(process.env.CONNECTIONS || '100', 10);
const WARMUP_SECONDS = Math.min(0.3, DURATION);
const REBUILD = process.argv.includes('--rebuild');

const FRAMEWORKS = {
	torpor: { port: 7101 },
	express: { port: 7102 },
	hono: { port: 7103 },
	fastify: { port: 7104 },
	elysia: { port: 7105 },
};

const CASES = [
	{
		name: 'ping GET /',
		method: 'GET',
		path: '/',
		// Each case records the expected response signature so a silently
		// broken route can't "win" the benchmark
		verify: (status, body, headers) =>
			status === 200 && body === 'Hi' && (headers['content-type'] || '').startsWith('text/plain'),
	},
	{
		name: 'query GET /id/42?name=bench',
		method: 'GET',
		path: '/id/42?name=bench',
		verify: (status, body, headers) =>
			status === 200 && body === '42 bench' && headers['x-powered-by'] === 'benchmark',
	},
	{
		name: 'json GET /user',
		method: 'GET',
		path: '/user',
		verify: (status, body) =>
			status === 200 &&
			body === JSON.stringify({ id: 123, name: 'Alice', roles: ['admin', 'editor'] }),
	},
	{
		name: 'body POST /json',
		method: 'POST',
		path: '/json',
		body: '{"hello":"world"}',
		headers: { 'content-type': 'application/json' },
		verify: (status, body) => status === 200 && body === '{"hello":"world"}',
	},
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function selectedFrameworks() {
	const filter = process.env.FRAMEWORKS?.split(',').map((f) => f.trim());
	return Object.entries(FRAMEWORKS)
		.filter(([name]) => !filter || filter.includes(name))
		.map(([name, f]) => ({ name, ...f }));
}

function selectedCases() {
	const filter = process.env.CASE;
	return filter ? CASES.filter((c) => c.name.startsWith(filter)) : CASES;
}

// ── Server management ───────────────────────────────────────────────────────

async function waitForServer(url, timeoutMs = 30_000) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const res = await fetch(url);
			if (res.ok) return true;
		} catch {
			// not up yet
		}
		await sleep(150);
	}
	return false;
}

async function buildTorpor() {
	const entry = path.join(HERE, 'servers', 'torpor', 'dist', 'server', 'serverEntry.js');
	if (fs.existsSync(entry) && !REBUILD) {
		return;
	}
	console.error('building torpor fixture (tb --build)…');
	await new Promise((resolve, reject) => {
		const child = spawn('pnpm', ['exec', 'tb', '--build'], {
			cwd: path.join(HERE, 'servers', 'torpor'),
			stdio: 'inherit',
		});
		child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`tb exited ${code}`))));
		child.on('error', reject);
	});
}

function serverCommand(name) {
	const dir = path.join(HERE, 'servers');
	switch (name) {
		case 'torpor':
			return { cmd: process.execPath, args: [path.join(dir, 'torpor', 'serve.mjs')] };
		case 'express':
			return { cmd: process.execPath, args: [path.join(dir, 'express.cjs')] };
		case 'hono':
			return { cmd: process.execPath, args: [path.join(dir, 'hono.mjs')] };
		case 'fastify':
			return { cmd: process.execPath, args: [path.join(dir, 'fastify.cjs')] };
		case 'elysia':
			return { cmd: process.execPath, args: [path.join(dir, 'elysia.mjs')] };
		default:
			throw new Error(`unknown framework: ${name}`);
	}
}

async function startServer(name, port) {
	const { cmd, args } = serverCommand(name);
	const child = spawn(cmd, args, {
		cwd: HERE,
		env: { ...process.env, PORT: String(port), HOST, NODE_ENV: 'production' },
		stdio: ['ignore', 'ignore', 'pipe'],
	});
	let stderr = '';
	child.stderr.on('data', (d) => (stderr += d));
	const up = await waitForServer(`http://${HOST}:${port}/`);
	if (!up) {
		child.kill('SIGKILL');
		throw new Error(`${name} did not start on :${port}\n${stderr}`);
	}
	return { child, stderr: () => stderr };
}

function stopServer(server) {
	if (!server) return;
	try {
		server.child.kill('SIGTERM');
	} catch {
		// already gone
	}
}

// ── Measurement ─────────────────────────────────────────────────────────────

async function verifyCase(fw, c) {
	const url = `http://${HOST}:${fw.port}${c.path}`;
	const res = await fetch(url, {
		method: c.method,
		headers: c.headers,
		body: c.body,
	});
	const body = (await res.text()).trim();
	const ok = c.verify(res.status, body, Object.fromEntries(res.headers));
	if (!ok) {
		console.error(`  [${fw.name}] VERIFY FAILED for "${c.name}": status ${res.status}, body ${JSON.stringify(body.slice(0, 100))}`);
	}
	return ok;
}

async function runCase(fw, c) {
	const url = `http://${HOST}:${fw.port}${c.path}`;
	const opts = {
		url,
		connections: CONNECTIONS,
		method: c.method,
		headers: c.headers,
		body: c.body,
	};
	// Short discarded warmup so JIT/pool effects don't dominate a 1s sample.
	await autocannon({ ...opts, duration: WARMUP_SECONDS });
	const result = await autocannon({ ...opts, duration: DURATION });
	return {
		rps: result.requests.average,
		p50: result.latency.p50,
		p99: result.latency.p99,
		non2xx: result.non2xx,
	};
}

// ── Report ──────────────────────────────────────────────────────────────────

function printReport(results, names, caseNames) {
	const W = 13;
	const LABEL = Math.max(26, ...caseNames.map((c) => c.name.length + 2));
	console.log();
	console.log('req/sec (higher is better)');
	console.log('Case'.padEnd(LABEL) + '| ' + names.map((n) => n.padEnd(W)).join('| '));
	console.log('-'.repeat(LABEL) + '+-' + names.map(() => '-'.repeat(W)).join('+-'));
	for (const c of caseNames) {
		const row = [c.name.padEnd(LABEL)];
		for (const n of names) {
			const r = results[n][c.name];
			row.push(r ? Math.round(r.rps).toLocaleString('en-US').padEnd(W) : 'FAILED'.padEnd(W));
		}
		console.log(row.join('| '));
	}

	console.log();
	console.log('latency p50 ms (lower is better)');
	console.log('Case'.padEnd(LABEL) + '| ' + names.map((n) => n.padEnd(W)).join('| '));
	console.log('-'.repeat(LABEL) + '+-' + names.map(() => '-'.repeat(W)).join('+-'));
	for (const c of caseNames) {
		const row = [c.name.padEnd(LABEL)];
		for (const n of names) {
			const r = results[n][c.name];
			row.push(r ? r.p50.toFixed(2).padEnd(W) : '-'.padEnd(W));
		}
		console.log(row.join('| '));
	}

	// Ratios vs torpor (falling back to the first framework).
	const baselineName = names.includes('torpor') ? 'torpor' : names[0];
	if (names.length > 1) {
		console.log();
		console.log(`ratio vs ${baselineName} (req/sec; >1 means faster than ${baselineName}):`);
		for (const c of caseNames) {
			const row = ['  ' + c.name.padEnd(24)];
			for (const n of names) {
				if (n === baselineName) continue;
				const r = results[n][c.name];
				const b = results[baselineName][c.name];
				const ratio = r && b ? r.rps / b.rps : NaN;
				row.push(`${n}: ${Number.isNaN(ratio) ? 'n/a' : ratio.toFixed(2) + 'x'}`.padEnd(20));
			}
			console.log(row.join(' '));
		}
	}
}

// ── Main ────────────────────────────────────────────────────────────────────

(async () => {
	const fws = selectedFrameworks();
	const cases = selectedCases();
	const names = fws.map((f) => f.name);

	if (names.includes('torpor')) {
		await buildTorpor();
	}

	const running = [];
	const results = Object.fromEntries(names.map((n) => [n, {}]));

	try {
		for (const fw of fws) {
			try {
				const server = await startServer(fw.name, fw.port);
				running.push([fw, server]);
				console.error(`${fw.name} ready on :${fw.port}`);
			} catch (e) {
				// An optional framework (e.g. elysia) failing to start shouldn't
				// take down the whole run
				console.error(`SKIPPING ${fw.name}: ${e.message.split('\n')[0]}`);
			}
		}

		const started = running.map(([fw]) => fw.name);
		if (started.length === 0) throw new Error('no framework servers started');

		for (const [fw] of running) {
			for (const c of cases) {
				if (!(await verifyCase(fw, c))) continue;
				process.stderr.write(`running ${fw.name} — ${c.name}…\n`);
				results[fw.name][c.name] = await runCase(fw, c);
			}
			stopServer(running.find(([f]) => f.name === fw.name)?.[1]);
		}

		printReport(results, started, cases);

		if (process.env.BENCH_JSON) {
			const payload = {
				suite: 'build-http',
				duration: DURATION,
				connections: CONNECTIONS,
				frameworks: started.map((name) => ({
					name,
					cases: Object.fromEntries(
						Object.entries(results[name]).map(([c, r]) => [
							c,
							{ rps: r.rps, p50: r.p50, p99: r.p99, non2xx: r.non2xx },
						]),
					),
				})),
			};
			fs.writeFileSync(process.env.BENCH_JSON, JSON.stringify(payload, null, '\t') + '\n');
			console.error(`BENCH_JSON written to ${process.env.BENCH_JSON}`);
		}
	} finally {
		for (const [, server] of running) stopServer(server);
	}
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
