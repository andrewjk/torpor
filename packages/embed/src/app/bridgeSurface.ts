import type { CompileError } from "@torpor/view/compile";
import type { ManifestApiMethod } from "./manifest";

/**
 * Bridge calls found in a compiled client build. Method/type names must be
 * string literals to be visible here — dynamically composed names can't be
 * checked statically (the runtime surface warning still catches those).
 */
export interface BridgeUsage {
	/** Methods passed to `$embed.invoke`. */
	invokes: string[];
	/** Types passed to `$embed.emit`. */
	emits: string[];
	/** Types passed to `$embed.on`. */
	listens: string[];
}

const INVOKE = /\.invoke(?:\?\.)?\(\s*(?:"([^"]*)"|'([^']*)')/g;
const EMIT = /\.emit(?:\?\.)?\(\s*(?:"([^"]*)"|'([^']*)')/g;
const ON = /\.on(?:\?\.)?\(\s*(?:"([^"]*)"|'([^']*)')/g;

export function scanBridgeUsage(code: string): BridgeUsage {
	const collect = (pattern: RegExp): string[] => {
		const found: string[] = [];
		for (const match of code.matchAll(pattern)) {
			found.push(match[1] ?? match[2] ?? "");
		}
		return found;
	};
	return {
		invokes: collect(INVOKE),
		emits: collect(EMIT),
		listens: collect(ON),
	};
}

/** The declared bridge surface, as compile options. */
export interface BridgeSurfaceOptions {
	api?: Record<string, ManifestApiMethod>;
	emits?: string[];
	pushes?: string[];
}

/**
 * Checks the bridge calls found in a compiled client build against the app
 * manifest's declared surface. **Default deny**: an embed that uses the
 * bridge must declare the surface it uses — calls outside the declaration
 * (or without any declaration) are compile errors, one per distinct name.
 * Dynamically composed names are invisible to this scan; the runtime
 * surface warning catches those.
 */
export function checkBridgeSurface(
	usage: BridgeUsage,
	options: BridgeSurfaceOptions,
): CompileError[] {
	const errors: CompileError[] = [];
	const fail = (message: string): void => {
		errors.push({
			message,
			startIndex: 0,
			startLine: 0,
			startChar: 0,
			endIndex: 0,
			endLine: 0,
			endChar: 0,
		});
	};

	if (usage.invokes.length > 0 && options.api === undefined) {
		const names = [...new Set(usage.invokes)].join(", ");
		fail(
			`Embed calls $embed.invoke("${usage.invokes[0]}", …), but its app manifest declares no api surface. Declare the methods it may invoke: api: { ${names}: … }.`,
		);
	} else if (options.api !== undefined) {
		const declared = Object.keys(options.api).join(", ") || "(none)";
		for (const method of new Set(usage.invokes)) {
			if (!Object.hasOwn(options.api, method)) {
				fail(
					`Embed calls $embed.invoke("${method}"), which is not declared in the app manifest's api. Declared methods: ${declared}.`,
				);
			}
		}
	}

	if (usage.emits.length > 0 && options.emits === undefined) {
		const names = [...new Set(usage.emits)].join(", ");
		fail(
			`Embed emits "${usage.emits[0]}", but its app manifest declares no emits surface. Declare the events it may emit: emits: [${names}].`,
		);
	} else if (options.emits !== undefined) {
		for (const type of new Set(usage.emits)) {
			if (!options.emits.includes(type)) {
				fail(
					`Embed emits "${type}", which is not declared in the app manifest's emits. Declared events: ${options.emits.join(", ") || "(none)"}.`,
				);
			}
		}
	}

	if (usage.listens.length > 0 && options.pushes === undefined) {
		const names = [...new Set(usage.listens)].join(", ");
		fail(
			`Embed subscribes to "${usage.listens[0]}" ($embed.on), but its app manifest declares no pushes surface. Declare the pushes it may listen to: pushes: [${names}].`,
		);
	} else if (options.pushes !== undefined) {
		for (const type of new Set(usage.listens)) {
			if (!options.pushes.includes(type)) {
				fail(
					`Embed subscribes to "${type}" ($embed.on), which is not declared in the app manifest's pushes. Declared pushes: ${options.pushes.join(", ") || "(none)"}.`,
				);
			}
		}
	}
	return errors;
}
