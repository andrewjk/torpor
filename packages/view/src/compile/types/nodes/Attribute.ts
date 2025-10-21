import type SourceSpan from "../SourceSpan";

export default interface Attribute {
	name: string;
	value?: string;
	reactive: boolean;
	fullyReactive: boolean;
	span: SourceSpan;
}
