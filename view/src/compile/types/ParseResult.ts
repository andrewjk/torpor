import CompileError from "./CompileError";
import ComponentParts from "./ComponentParts";

export default interface ParseResult {
  ok: boolean;
  errors: CompileError[];
  parts?: ComponentParts;
}
