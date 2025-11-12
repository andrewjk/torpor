type StyleValue =
	| string
	| Record<string, string | null | undefined>
	| Array<string | null | undefined>
	| null
	| undefined;

export default StyleValue;
