// Shared HTML report builder for the benchmark suites.
//
// Adapted from torpor-bench's lib/html-report.mjs: turns a runner's results
// into a self-contained HTML page — one table per section with a green→red
// heatmap per row (green = best for that row's direction), an underlined
// baseline column, a bold heatmapped total row, and previous/next links to the
// other benchmark pages (see RESULTS_PAGES).
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

// Canonical page order for the previous/next links; every benchmark writes
// <id>.html into benchmarks/results/ and links to its neighbours.
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

function navHtml(currentId) {
	const index = RESULTS_PAGES.findIndex((p) => p.id === currentId);
	const prev = RESULTS_PAGES[index - 1];
	const next = RESULTS_PAGES[index + 1];
	const link = (page, label) =>
		page
			? `<a href="${escapeHtml(page.file)}">${label}: ${escapeHtml(page.title)}</a>`
			: `<span class="disabled">${label}</span>`;
	return (
		`<nav class="pages">${link(prev, '← previous')} · ${link(next, 'next →')}</nav>`
	);
}

export function buildHtmlReport({
	suite,
	title,
	note,
	columns,
	baseline,
	sections,
	generatedAt,
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
${navHtml(suiteLabel)}
<h1>${pageTitle}</h1>
<p class="note">
	${escapeHtml(note ?? '')}
	<span class="legend"><i style="background:hsl(120,60%,88%)"></i><i style="background:hsl(60,60%,88%)"></i><i style="background:hsl(0,60%,88%)"></i></span>
	${baseline ? `· ratio baseline: <strong>${escapeHtml(baseline)}</strong>` : ''}
	<br>generated ${escapeHtml(generated.toISOString())}
</p>
${tables}
${navHtml(suiteLabel)}
</body>
</html>
`;
}
