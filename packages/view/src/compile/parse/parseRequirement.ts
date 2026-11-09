import type RequirementDeclaration from "../types/RequirementDeclaration";
import type Template from "../../types/Template";
import type ParseStatus from "./ParseStatus";
import { skipStringOrComment } from "../utils/codeScanner";
import addError from "./utils/addError";

const KIND_CHAR = /[A-Za-z0-9_.-]/;
const SPACE = /[ \t\r\n]/;

function atStatementStart(status: ParseStatus): boolean {
	let i = status.i - 1;
	while (i >= 0 && status.source[i] !== "\n" && SPACE.test(status.source[i])) i -= 1;
	if (i < 0) return true;
	const char = status.source[i];
	return char === "\n" || char === "{" || char === "}" || char === ";";
}

/**
 * Parses a file-level `data <name> from <kind> { <spec> }` declaration, if
 * one starts at the current position. Returns false (and rewinds) when the
 * text isn't a requirement declaration, so ordinary script can use `data`
 * as an identifier.
 */
export default function tryParseRequirement(status: ParseStatus): boolean {
	if (status.level !== 0 || status.braces.length !== 0) return false;
	if (!atStatementStart(status)) return false;
	if (status.source.substring(status.i, status.i + 4) !== "data") return false;
	const after = status.source[status.i + 4];
	if (after === undefined || !SPACE.test(after)) return false;
	if (status.i > 0 && /[A-Za-z0-9_$]/.test(status.source[status.i - 1])) return false;

	const saved = status.i;
	let i = status.i + 4;
	const skipSpace = () => {
		while (i < status.source.length && SPACE.test(status.source[i])) i += 1;
	};

	skipSpace();
	const nameStart = i;
	while (i < status.source.length && /[A-Za-z0-9_$]/.test(status.source[i])) i += 1;
	const name = status.source.substring(nameStart, i);
	if (!name || /^[0-9]/.test(name)) {
		status.i = saved;
		return false;
	}

	skipSpace();
	if (status.source.substring(i, i + 4) !== "from") {
		status.i = saved;
		return false;
	}
	i += 4;
	if (!SPACE.test(status.source[i] ?? "")) {
		status.i = saved;
		return false;
	}
	skipSpace();

	const kindStart = i;
	while (i < status.source.length && KIND_CHAR.test(status.source[i])) i += 1;
	const kind = status.source.substring(kindStart, i);
	if (!kind) {
		status.i = saved;
		return false;
	}

	skipSpace();
	if (status.source[i] !== "{") {
		status.i = saved;
		return false;
	}
	i += 1;

	const specStart = i;
	let level = 1;
	while (i < status.source.length) {
		const skipped = skipStringOrComment(status.source, i);
		if (skipped !== -1) {
			i = skipped;
			continue;
		}
		if (status.source[i] === "{") {
			level += 1;
		} else if (status.source[i] === "}") {
			level -= 1;
			if (level === 0) break;
		}
		i += 1;
	}

	if (level !== 0) {
		addError(status, `Unterminated data requirement "${name}"`, nameStart, status.source.length);
		status.i = status.source.length;
		return true;
	}

	const specEnd = i;
	i += 1;

	const declaration: RequirementDeclaration = {
		name,
		kind,
		spec: status.source.substring(specStart, specEnd),
		specStart,
		span: { start: saved, end: i },
	};
	status.requirements.push(declaration);
	status.i = i;
	return true;
}

/**
 * Removes requirement declarations from the compiled script (they are not
 * JS) and binds `$data` inside every component body, so both builds read
 * the host-provided data bag through `$props.$data`.
 */
export function applyRequirementSubstitutions(status: ParseStatus): void {
	if (status.requirements.length === 0) return;
	for (const chunk of status.script) {
		const replacements = status.requirements
			.filter(
				(requirement) =>
					requirement.span.start >= chunk.span.start && requirement.span.end <= chunk.span.end,
			)
			.sort((a, b) => b.span.start - a.span.start);
		if (replacements.length === 0) continue;
		let text = chunk.script;
		for (const requirement of replacements) {
			const start = requirement.span.start - chunk.span.start;
			const end = requirement.span.end - chunk.span.start;
			text = text.substring(0, start) + "/* data requirement */" + text.substring(end);
		}
		chunk.script = text;
	}

	// Insert the binding as its own chunk after the `/* @start */` marker:
	// the builds match that marker by exact string, so it must stay intact.
	for (let i = 0; i < status.script.length; i++) {
		if (status.script[i].script === "/* @start */") {
			status.script.splice(i + 1, 0, {
				script: " let $data = $props?.$data ?? {};",
				span: { start: 0, end: 0 },
			});
			i += 1;
		}
	}

	// The injected read keeps every component's `$props` param named: both
	// builds rename unused params to `_$props`, which would leave the
	// binding referencing an undefined `$props`. The "$data" entry starts
	// with "$", so it is also excluded from the root-component extra-prop
	// binding loop (it is not a real declared prop).
	for (const component of status.components) {
		if (!component.props?.length) component.props = ["$data"];
	}
}

/**
 * Binds `$data` in a parsed template whose requirements come from an **app
 * manifest** instead of in-source `data … from …` declarations. Same effect
 * as the binding `applyRequirementSubstitutions` installs at parse time —
 * without it the client build references an undeclared `$data`.
 */
export function bindDataTemplate(template: Template): void {
	// Insert the binding as its own chunk after the `/* @start */` marker:
	// the builds match that marker by exact string, so it must stay intact.
	for (let i = 0; i < template.script.length; i++) {
		if (template.script[i].script === "/* @start */") {
			template.script.splice(i + 1, 0, {
				script: " let $data = $props?.$data ?? {};",
				span: { start: 0, end: 0 },
			});
			i += 1;
		}
	}
	for (const component of template.components) {
		if (!component.props?.length) component.props = ["$data"];
	}
}
