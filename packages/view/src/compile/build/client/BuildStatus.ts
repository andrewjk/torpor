import type BuildOptions from "../../types/BuildOptions";
import type CompileError from "../../types/CompileError";
import type ForVar from "../../types/ForVar";
import type SourceMapping from "../../types/SourceMapping";
import type Fragment from "../../types/nodes/Fragment";

export default interface BuildStatus {
	imports: Set<string>;
	props: string[];
	contextProps: string[];
	slotProps: string[];
	styleHash: string;
	map: SourceMapping[];
	varNames: Record<string, number>;
	fragmentStack: {
		fragment?: Fragment;
		path: string;
	}[];
	forVars: ForVar[];
	ns: boolean;
	preserveWhitespace: boolean;
	inHead: boolean;
	options: BuildOptions;
	errors: CompileError[];
}
