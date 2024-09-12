import type ComponentTemplate from "../../types/ComponentTemplate";
import type CompileError from "./CompileError";

export default interface ParseResult {
	ok: boolean;
	errors: CompileError[];
	template?: ComponentTemplate;
}
