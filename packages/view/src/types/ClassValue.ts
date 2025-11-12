type ClassValue =
	| string
	| Record<string, string | null | undefined>
	| Array<ClassValue>
	| null
	| undefined;

export default ClassValue;
