export type Fragment = {
	number: number;
	text: string;
	ns: boolean;
	events: {
		varName: string;
		eventName: string;
		handler: string;
	}[];
	animations: string[];
	endVarName?: string;
};
