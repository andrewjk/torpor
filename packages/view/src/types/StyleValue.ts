type StyleValue =
	| string
	| Record<string, string | null | undefined>
	| Array<StyleValue>
	| null
	| undefined;

export default StyleValue;
