import type SourceRange from "../SourceRange";

export default interface Fragment {
	number: number;
	text: string;
	ns: boolean;
	effects: {
		functionBody: string;
		ranges: SourceRange[];
		offsets: number[];
		lengths: number[];
	}[];
	events: {
		varName: string;
		eventName: string;
		handler: string;
	}[];
	animations: string[];
	endVarName?: string;
}
