import type Template from "../../types/Template";
import type CompileError from "./CompileError";

export default interface ParseResult {
	ok: boolean;
	errors: CompileError[];
	template?: Template;
}
