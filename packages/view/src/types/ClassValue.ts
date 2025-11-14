type ClassValue =
	| string
	| Record<string, boolean | null | undefined>
	| Array<ClassValue>
	| null
	| undefined;

export default ClassValue;
