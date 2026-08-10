// HTML report builder for benchmark results.
//
// Turns a merged suite result (the same shape bench.mjs writes as
// <suite>.json) into a self-contained HTML page: an ops × targets table with a
// per-op green→red heatmap (green = fastest in that row, red = slowest). Timing
// ops (those carrying a `score`) are coloured; deterministic count ops (only
// `median`) are shown plain. The baseline column (torpor) is labelled so the
// ratio framing from the console matches at a glance, and the total row is a
// weighted geometric mean of each target's per-op scores relative to a REFERENCE
// framework — octane-tsrx (falling back to torpor), weighted by the reference's
// own per-op time, so the reference reads exactly 1 (faster overall < 1, slower > 1).

export const HTML_BASELINE = "torpor";
// Reference framework for the timing total row's weighted geometric mean.
export const TOTAL_REFERENCE = "octane-tsrx";

function escapeHtml(s) {
	return String(s)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function fmtNum(v) {
	if (v >= 100) return v.toFixed(0);
	if (v >= 10) return v.toFixed(1);
	if (v >= 1) return v.toFixed(2);
	return v.toFixed(3);
}

function heatmapColor(score, min, max) {
	if (max === min) return "hsl(120, 60%, 88%)"; // single sample / all-equal
	const t = (score - min) / (max - min); // 0 = fastest, 1 = slowest
	const hue = 120 * (1 - t); // 120 green → 0 red
	return `hsl(${hue.toFixed(0)}, 60%, 88%)`;
}

export function buildHtmlReport(result) {
	const targets = result.targets ?? [];
	if (targets.length === 0) return null;
	// Union of op names across targets, first-seen order from target[0].
	const opOrder = [];
	for (const t of targets) {
		for (const op of Object.keys(t.ops ?? {})) {
			if (!opOrder.includes(op)) opOrder.push(op);
		}
	}
	if (opOrder.length === 0) return null;
	const names = targets.map((t) => t.name);
	const isTiming = (op) => targets.some((t) => typeof t.ops?.[op]?.score === "number");
	const timingOps = opOrder.filter(isTiming);
	const countOps = opOrder.filter((op) => !isTiming(op));

	const headerCells = names
		.map((n) => `<th${n === HTML_BASELINE ? ' class="baseline"' : ""}>${escapeHtml(n)}</th>`)
		.join("");

	const timingRows = timingOps
		.map((op) => {
			const scores = targets.map((t) => t.ops?.[op]?.score).filter((v) => typeof v === "number");
			const min = scores.length ? Math.min(...scores) : 0;
			const max = scores.length ? Math.max(...scores) : 0;
			const cells = targets
				.map((t) => {
					const stat = t.ops?.[op];
					if (!stat || typeof stat.score !== "number") return '<td class="na">—</td>';
					const bg = heatmapColor(stat.score, min, max);
					const tip = `score ${fmtNum(stat.score)} · min ${fmtNum(stat.min)}${
						stat.p95 != null ? ` · p95 ${fmtNum(stat.p95)}` : ""
					} · n ${stat.samples ?? "?"}`;
					return `<td style="background:${bg}" title="${tip}">${fmtNum(stat.score)}</td>`;
				})
				.join("");
			return `<tr><th scope="row">${escapeHtml(op)}</th>${cells}</tr>`;
		})
		.join("");

	// Total row: a weighted geometric mean of each target's per-op scores
	// relative to a REFERENCE framework (octane-tsrx, falling back to torpor, then
	// to the plain sum when neither is present). ratio = target.score /
	// reference.score, weighted by the reference's own score so long-running ops
	// dominate; the reference itself therefore reads exactly 1, a target faster
	// overall lands < 1, slower > 1. Missing/zero scores are skipped, not zeroed.
	// Heatmap shades the totals across targets — green = lowest (fastest overall),
	// red = highest.
	const referenceTarget =
		targets.find((t) => t.name === TOTAL_REFERENCE) ??
		targets.find((t) => t.name === HTML_BASELINE) ??
		null;
	const totalsByTarget = targets.map((t) => {
		if (referenceTarget) {
			let weightedLogSum = 0;
			let weightSum = 0;
			let counted = 0;
			for (const op of timingOps) {
				const s = t.ops?.[op]?.score;
				const base = referenceTarget.ops?.[op]?.score;
				if (typeof s === "number" && s > 0 && typeof base === "number" && base > 0) {
					weightedLogSum += base * Math.log(s / base);
					weightSum += base;
					counted++;
				}
			}
			return { value: weightSum > 0 ? Math.exp(weightedLogSum / weightSum) : NaN, counted };
		}
		let sum = 0;
		let counted = 0;
		for (const op of timingOps) {
			const s = t.ops?.[op]?.score;
			if (typeof s === "number") {
				sum += s;
				counted++;
			}
		}
		return { value: sum, counted };
	});
	const totalNums = totalsByTarget.map((x) => x.value).filter((v) => Number.isFinite(v));
	const totalMin = totalNums.length ? Math.min(...totalNums) : 0;
	const totalMax = totalNums.length ? Math.max(...totalNums) : 0;
	const totalCells = totalsByTarget
		.map((x) => {
			if (x.counted === 0 || !Number.isFinite(x.value)) return '<td class="na">—</td>';
			const bg = heatmapColor(x.value, totalMin, totalMax);
			const tip = referenceTarget
				? `${referenceTarget.name}-time-weighted geomean of ${x.counted} timing op(s) vs ${referenceTarget.name}`
				: `sum of ${x.counted} timing op(s)`;
			return `<td style="background:${bg}" class="total" title="${tip}">${fmtNum(x.value)}</td>`;
		})
		.join("");
	const totalRow =
		timingOps.length && totalsByTarget.some((x) => x.counted > 0)
			? `<tr class="total-row"><th scope="row">total</th>${totalCells}</tr>`
			: "";

	const countRows = countOps
		.map((op) => {
			const vals = targets.map((t) => t.ops?.[op]?.median).filter((v) => typeof v === "number");
			const min = vals.length ? Math.min(...vals) : 0;
			const max = vals.length ? Math.max(...vals) : 0;
			const cells = targets
				.map((t) => {
					const stat = t.ops?.[op];
					if (!stat) return '<td class="na">—</td>';
					const bg = heatmapColor(stat.median, min, max);
					return `<td style="background:${bg}">${Math.round(stat.median)}</td>`;
				})
				.join("");
			return `<tr><th scope="row">${escapeHtml(op)}</th>${cells}</tr>`;
		})
		.join("");

	const timingTable = timingOps.length
		? `<section><h2>timing <span class="unit">ms · lower is better</span></h2>` +
			`<table><thead><tr><th></th>${headerCells}</tr></thead><tbody>${timingRows}${totalRow}</tbody></table></section>`
		: "";
	const countTable = countOps.length
		? `<section><h2>counts <span class="unit">deterministic</span></h2>` +
			`<table><thead><tr><th></th>${headerCells}</tr></thead><tbody>${countRows}</tbody></table></section>`
		: "";

	const baselineNote = names.includes(HTML_BASELINE)
		? `<br>ratio baseline: <strong>${escapeHtml(HTML_BASELINE)}</strong>` +
			(referenceTarget && referenceTarget.name !== HTML_BASELINE
				? ` · total vs <strong>${escapeHtml(referenceTarget.name)}</strong>`
				: "")
		: "";
	const suiteName = escapeHtml(result.suite || "benchmark");

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${suiteName}</title>
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
	.legend { display: inline-flex; gap: 2px; align-items: center; height: 12px; margin-left: .5rem; vertical-align: middle; }
	.legend i { display: inline-block; width: 12px; height: 12px; }
</style>
</head>
<body>
<h1>${suiteName}</h1>
<p class="note">
	green = lowest in row, red = highest (lower is better)
	<span class="legend"><i style="background:hsl(120,60%,88%)"></i><i style="background:hsl(60,60%,88%)"></i><i style="background:hsl(0,60%,88%)"></i></span>
	${baselineNote}
</p>
${timingTable}
${countTable}
</body>
</html>
`;
}
