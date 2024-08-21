import CompileError from "./CompileError";
import ComponentTemplate from "./ComponentTemplate";

export default interface ParseResult {
  ok: boolean;
  errors: CompileError[];
  parts?: ComponentTemplate;
}
