import type CompileError from "../types/CompileError";
import type RootNode from "../types/nodes/RootNode";
import collectMarkupExpressions from "./collectMarkupExpressions";
import { skipStringOrComment } from "./codeScanner";

/** One piece of a component's script, and where it starts in the source file */
export interface ScriptSegment {
	text: string;
	fileStart: number;
}

/**
 * Detects the "plain `let` initialized from `$props`, read from markup"
 * stale-capture trap. A component instantiated from a keyed `@for` stays
 * alive across list mutations while its props are updated in place — reads
 * of `$props.x` in template expressions track correctly, but a plain `let x =
 * ...$props.y...` is evaluated once at setup, so template effects reading
 * `x` never re-run and silently keep the previous row's values.
 *
 * Detection is best-effort and syntactic: top-level `let` declarations in the
 * component script whose initializer (up to the first `;` or newline) mentions
 * `$props`, and whose name then appears in a markup expression. Deliberately a
 * warning, not an error — capturing a prop value once is sometimes intended,
 * and destructured/renamed forms (`let { x } = $props`) aren't detected.
 */
export default function stalePropLets(
	segments: ScriptSegment[],
	markup: RootNode | undefined,
	source: string | undefined,
): CompileError[] {
	// Concatenate the segments (sentinel chunks sit between them, so local
	// positions need mapping back to file offsets)
	let script = "";
	const deltas: { localStart: number; delta: number }[] = [];
	for (const segment of segments) {
		deltas.push({ localStart: script.length, delta: segment.fileStart });
		script += segment.text;
	}
	const toFileOffset = (local: number): number => {
		let delta = deltas[0].delta;
		for (const entry of deltas) {
			if (entry.localStart <= local) delta = entry.delta - entry.localStart;
			else break;
		}
		return local + delta;
	};

	// Collect `let` declarations whose initializer mentions $props, skipping
	// strings, comments and template literals so `let s = "let x = 1"` and
	// comments don't produce candidates
	const names: { name: string; local: number }[] = [];
	const LET = /^let[\s\n]/;
	for (let i = 0; i < script.length; i++) {
		const char = script[i];
		if (char === "'" || char === '"' || char === "`" || char === "/") {
			const skipped = skipStringOrComment(script, i);
			if (skipped !== -1) {
				i = skipped - 1;
				continue;
			}
		}
		if (!LET.test(script.slice(i, i + 4))) {
			continue;
		}
		if (i > 0 && /[\w$]/.test(script[i - 1])) {
			continue;
		}
		let j = i + 3;
		while (/\s/.test(script[j] ?? "")) j++;
		// The declared name
		let name = "";
		while (/[\w$]/.test(script[j] ?? "")) {
			name += script[j];
			j++;
		}
		if (!name) continue;
		// Skip an optional type annotation, then expect "="
		while (/\s/.test(script[j] ?? "")) j++;
		if (script[j] === ":") {
			j++;
			while (script[j] !== undefined && script[j] !== "=" && script[j] !== "\n") j++;
		}
		while (/\s/.test(script[j] ?? "")) j++;
		if (script[j] !== "=" || script[j + 1] === "=") continue;
		j++;
		// The initializer runs to the first `;` or newline outside a nested
		// literal (the common forms — expressions, template literals, calls —
		// are single-statement; multi-line initializers just won't match)
		const initStart = j;
		let init = "";
		while (j < script.length && script[j] !== ";" && script[j] !== "\n") {
			if (script[j] === "'" || script[j] === '"' || script[j] === "`") {
				const skipped = skipStringOrComment(script, j);
				if (skipped !== -1) {
					init += script.slice(j, skipped);
					j = skipped;
					continue;
				}
			}
			init += script[j];
			j++;
		}
		void initStart;
		if (/\$props\b/.test(init)) {
			names.push({ name, local: i });
		}
		i = j;
	}

	if (names.length === 0 || !markup) {
		return [];
	}

	// Every expression the markup references — control statements, reactive
	// attribute values, `{...}` interpolations
	const expressions = collectMarkupExpressions(markup);
	if (!expressions) return [];

	const warnings: CompileError[] = [];
	for (const { name, local } of names) {
		const escaped = name.replace(/\$/g, "\\$");
		if (!new RegExp(`(^|[^\\w$])${escaped}([^\\w$]|$)`).test(expressions)) {
			continue;
		}
		const absolute = toFileOffset(local);
		let startLine = 0;
		let lastLineStart = 0;
		if (source !== undefined) {
			for (let i = 0; i < absolute && i < source.length; i++) {
				if (source[i] === "\n") {
					startLine += 1;
					lastLineStart = i + 1;
				}
			}
		}
		warnings.push({
			message:
				`'${name}' is a plain let initialized from $props. Its value is captured ` +
				`once at setup, so template expressions reading it won't update when ` +
				`the component's props change (keyed lists keep components alive and ` +
				`update props in place). Use a getter or $cache if it should stay live.`,
			startIndex: absolute,
			startLine,
			startChar: absolute - lastLineStart,
			endIndex: absolute,
			endLine: startLine,
			endChar: absolute - lastLineStart,
		});
	}
	return warnings;
}
