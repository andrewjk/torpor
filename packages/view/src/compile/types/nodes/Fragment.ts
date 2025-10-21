import type SourceSpan from "../SourceSpan";

export default interface Fragment {
	number: number;
	text: string;
	ns: boolean;
	effects: {
		functionBody: string;
		spans: SourceSpan[];
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
