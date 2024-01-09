import CompileError from "./CompileError";
import SyntaxTree from "./SyntaxTree";

export default interface ParseResult {
  ok: boolean;
  errors: CompileError[];
  syntaxTree?: SyntaxTree;
}
