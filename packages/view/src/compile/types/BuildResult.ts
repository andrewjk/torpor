import type CompileError from "./CompileError";
import type SourceMapping from "./SourceMapping";

export default interface BuildResult {
	code: string;
	styles: {
		style: string;
		hash: string;
	}[];
	map: SourceMapping[];
	errors: CompileError[];
	/**
	 * Non-fatal diagnostics — things that compile and run, but are very
	 * likely a mistake (e.g. a plain `let` initialized from `$props` that a
	 * template expression reads: silent stale capture in keyed lists).
	 */
	warnings: CompileError[];
}
