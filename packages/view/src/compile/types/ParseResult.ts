import { type Template } from "../../types/Template";
import { type CompileError } from "./CompileError";

export type ParseResult = {
	ok: boolean;
	errors: CompileError[];
	template?: Template;
};
