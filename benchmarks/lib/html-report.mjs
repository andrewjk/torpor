// Shared HTML report builder for the benchmark suites.
//
// Adapted from torpor-bench's lib/html-report.mjs: turns a runner's results
// into a self-contained HTML page — one table per section with a green→red
// heatmap per row (green = best for that row's direction), an underlined
// baseline column, a bold heatmapped total row. Pages link to the previous
// and next RUN of their suite (see writeRunResults) and to the other
// benchmark suite's latest page (see RESULTS_PAGES).
//
// Runners describe their results generically:
//
//   buildHtmlReport({
//     suite: "view",
//     title: "view benchmarks",
//     note: "5 iterations · green = best in row",
//     columns: ["torpor", "react", ...],
//     baseline: "torpor",
//     sections: [{
//       heading: "timing",
//       unit: "ms · lower is better",
//       lowerIsBetter: true,
//       format: "ms", // "ms" | "rps" | "count"
//       rows: [
//         { op: "run", values: { torpor: 4.2, react: 57.6 } },
//         { op: "total", total: true, values: { torpor: 1, react: 13.7 } },
//       ],
//     }],
//   });

import fs from 'node:fs';
import path from 'node:path';

// Canonical page order for the suite links; every benchmark's latest run
// lives at <id>.html in benchmarks/results/ and links to the other suite.
export const RESULTS_PAGES = [
	{ id: 'view', file: 'view.html', title: 'view (client-side)' },
	{ id: 'build', file: 'build.html', title: 'build (server-side)' },
];

function escapeHtml(s) {
	return String(s)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

const FORMATTERS = {
	ms(v) {
		if (v >= 100) return v.toFixed(0);
		if (v >= 10) return v.toFixed(1);
		if (v >= 1) return v.toFixed(2);
		return v.toFixed(3);
	},
	rps(v) {
		return Math.round(v).toLocaleString('en-US');
	},
	count(v) {
		return Math.round(v).toLocaleString('en-US');
	},
	ratio(v) {
		return v.toFixed(2);
	},
};

function heatmapColor(value, min, max, lowerIsBetter) {
	if (max === min) return 'hsl(120, 60%, 88%)'; // single sample / all-equal
	// t = 0 at the best end of the row, 1 at the worst
	const t = lowerIsBetter ? (value - min) / (max - min) : (max - value) / (max - min);
	const hue = 120 * (1 - t); // 120 green → 0 red
	return `hsl(${hue.toFixed(0)}, 60%, 88%)`;
}

function navHtml(currentId, prevRun, nextRun) {
	const index = RESULTS_PAGES.findIndex((p) => p.id === currentId);
	const suiteLink = (page) => {
		if (!page) return '';
		if (page.id === currentId) {
			return `<strong>${escapeHtml(page.title)}</strong>`;
		}
		return `<a href="${escapeHtml(page.file)}">${escapeHtml(page.title)}</a>`;
	};
	const runLink = (run, label) =>
		run
			? `<a href="${escapeHtml(run.file)}">${label}: ${escapeHtml(run.label)}</a>`
			: `<span class="disabled">${label}${run === null ? ' (latest)' : ''}</span>`;
	const suites = RESULTS_PAGES.map(suiteLink).join(' · ');
	const runs = `${runLink(prevRun, '← previous run')} · ${runLink(nextRun, 'next run →')}`;
	return `<nav class="pages">suites: ${suites} &nbsp;|&nbsp; runs: ${runs}</nav>`;
}

// ── run history ─────────────────────────────────────────────────────────────
// Each run is archived as `<suite>-<timestamp>.html` + `.json`, with
// `<suite>.html` / `<suite>.json` holding the latest run. Pages link to the
// previous and next run of their suite (a run's "next" link is backfilled by
// the following run, which regenerates the previous archive from its JSON)
// and to the other suite's latest page.

export function compactTimestamp(date = new Date()) {
	// Fixed-width and sortable: 20260902T124101
	const iso = date instanceof Date ? date.toISOString() : new Date(date).toISOString();
	return iso.replace(/[-:]/g, '').replace(/\..+/, '');
}

export function formatTimestamp(compact) {
	const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/.exec(compact);
	return m ? `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]} UTC` : compact;
}

function archiveToRun(file, suite) {
	return {
		file,
		label: formatTimestamp(file.slice(suite.length + 1, -'.html'.length)),
	};
}

/**
 * Persists one benchmark run: an immutable timestamped archive (json + html),
// plus `<suite>.json` / `<suite>.html` copies of the latest run. `renderHtml`
 * receives `(payload, { prevRun, nextRun })` and returns the page HTML.
 */
export function writeRunResults({ suite, payload, resultsDir, renderHtml }) {
	fs.mkdirSync(resultsDir, { recursive: true });

	const ts = compactTimestamp();
	const base = `${suite}-${ts}`;
	const archives = fs
		.readdirSync(resultsDir)
		.filter((f) => f.startsWith(`${suite}-`) && f.endsWith('.html'))
		.sort();
	const prevFile = archives.at(-1) ?? null;
	const prevPrevFile = archives.at(-2) ?? null;

	// This run is the previous run's "next": regenerate that page from its
	// archived JSON with the link filled in
	if (prevFile) {
		const prevJsonPath = path.join(resultsDir, prevFile.replace(/\.html$/, '.json'));
		try {
			const prevPayload = JSON.parse(fs.readFileSync(prevJsonPath, 'utf8'));
			fs.writeFileSync(
				path.join(resultsDir, prevFile),
				renderHtml(prevPayload, {
					prevRun: prevPrevFile ? archiveToRun(prevPrevFile, suite) : undefined,
					nextRun: { file: `${base}.html`, label: formatTimestamp(ts) },
				}),
			);
		} catch {
			// A missing/corrupt previous archive shouldn't fail this run
		}
	}

	// Archive this run
	const generatedAt = new Date().toISOString();
	payload.generatedAt = generatedAt;
	const json = JSON.stringify(payload, null, '\t') + '\n';
	fs.writeFileSync(path.join(resultsDir, `${base}.json`), json);
	const nav = {
		prevRun: prevFile ? archiveToRun(prevFile, suite) : undefined,
		nextRun: undefined,
	};
	fs.writeFileSync(path.join(resultsDir, `${base}.html`), renderHtml(payload, nav));

	// Latest copies
	fs.writeFileSync(path.join(resultsDir, `${suite}.json`), json);
	fs.writeFileSync(path.join(resultsDir, `${suite}.html`), renderHtml(payload, nav));

	return { timestamp: ts, archive: `${base}.html` };
}

export function buildHtmlReport({
	suite,
	title,
	note,
	columns,
	baseline,
	sections,
	generatedAt,
	prevRun,
	nextRun,
}) {
	if (!columns?.length || !sections?.length) return null;
	const generated = generatedAt ?? new Date();
	const headerCells = columns
		.map(
			(n) =>
				`<th${n === baseline ? ' class="baseline"' : ''}>${escapeHtml(n)}</th>`,
		)
		.join('');

	const tables = sections
		.map((section) => {
			const rows = section.rows
				.map((row) => {
					const fmt = FORMATTERS[row.format ?? section.format] ?? FORMATTERS.ms;
					const values = Object.values(row.values ?? {}).filter(
						(v) => typeof v === 'number' && Number.isFinite(v),
					);
					const min = values.length ? Math.min(...values) : 0;
					const max = values.length ? Math.max(...values) : 0;
					const cells = columns
						.map((col) => {
							const v = row.values?.[col];
							if (typeof v !== 'number' || !Number.isFinite(v)) {
								return '<td class="na">—</td>';
							}
							const bg = heatmapColor(v, min, max, section.lowerIsBetter);
							return `<td style="background:${bg}">${fmt(v)}</td>`;
						})
						.join('');
					const cls = row.total ? ' class="total-row"' : '';
					return `<tr${cls}><th scope="row">${escapeHtml(row.op)}</th>${cells}</tr>`;
				})
				.join('');
			const unit = section.unit ? ` <span class="unit">${escapeHtml(section.unit)}</span>` : '';
			return (
				`<section><h2>${escapeHtml(section.heading)}${unit}</h2>` +
				`<table><thead><tr><th></th>${headerCells}</tr></thead><tbody>${rows}</tbody></table></section>`
			);
		})
		.join('');

	const suiteLabel = escapeHtml(suite);
	const pageTitle = escapeHtml(title ?? suiteLabel);

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${pageTitle}</title>
<style>
	body { font: 14px/1.45 -apple-system, system-ui, sans-serif; margin: 2rem auto; max-width: 64rem; color: #222; }
	h1 { font-size: 1.3rem; margin: 0 0 .25rem; }
	h2 { font-size: 1.05rem; margin: 1.5rem 0 .5rem; }
	.unit { font-weight: 400; color: #888; font-size: .85rem; }
	.note { color: #666; font-size: .85rem; margin: 0 0 1rem; }
	table { border-collapse: collapse; margin: 0 0 1rem; }
	th, td { padding: 4px 10px; border: 1px solid #e2e2e2; text-align: right; white-space: nowrap; }
	tbody th, thead th:first-child { text-align: left; font-weight: 600; }
	thead th { background: #f6f6f6; }
	tr.total-row td, tr.total-row th { font-weight: 700; border-top: 2px solid #bbb; }
	th.baseline { text-decoration: underline; }
	td.na { color: #bbb; }
	nav.pages { margin: 1rem 0; font-size: .9rem; }
	nav.pages .disabled { color: #bbb; }
	nav.pages a { color: #06c; text-decoration: none; }
	nav.pages a:hover { text-decoration: underline; }
	.legend { display: inline-flex; gap: 2px; align-items: center; height: 12px; margin-left: .5rem; vertical-align: middle; }
	.legend i { display: inline-block; width: 12px; height: 12px; }
</style>
</head>
<body>
${navHtml(suiteLabel, prevRun, nextRun)}
<h1>${pageTitle}</h1>
<p class="note">
	run at ${escapeHtml(formatTimestamp(compactTimestamp(generated)))}
	<span class="legend"><i style="background:hsl(120,60%,88%)"></i><i style="background:hsl(60,60%,88%)"></i><i style="background:hsl(0,60%,88%)"></i></span>
	${baseline ? `· ratio baseline: <strong>${escapeHtml(baseline)}</strong>` : ''}
	${note ? `<br>${escapeHtml(note)}` : ''}
</p>
${tables}
${navHtml(suiteLabel, prevRun, nextRun)}
</body>
</html>
`;
}
