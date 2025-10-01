import type SourceRange from "../SourceRange";

export default interface Attribute {
	name: string;
	value?: string;
	reactive: boolean;
	fullyReactive: boolean;
	range: SourceRange;
}
