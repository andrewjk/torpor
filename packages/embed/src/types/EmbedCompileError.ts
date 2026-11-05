import type { CompileError } from "@torpor/view/compile";

/**
 * Compiling an embed's source failed.
 */
export default class EmbedCompileError extends Error {
	/**
	 * The parse/build errors, sorted by position in the source.
	 */
	errors: CompileError[];

	constructor(errors: CompileError[]) {
		const first = errors[0];
		super(first ? `${first.message} (at index ${first.startIndex})` : "Embed failed to compile");
		this.name = "EmbedCompileError";
		this.errors = [...errors].sort((a, b) => a.startIndex - b.startIndex);
	}
}
