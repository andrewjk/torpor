import type BuildOptions from "../../types/BuildOptions";
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
	forVarNames: string[][];
	ns: boolean;
	preserveWhitespace: boolean;
	inHead: boolean;
	options: BuildOptions;
}
