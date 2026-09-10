/**
 * The JSON-serialized form of a type: what a value looks like after a
 * JSON.stringify / JSON.parse round trip. Dates become strings, functions and
 * undefined properties are dropped.
 */
export type Jsonify<T> = T extends string | number | boolean | null
	? T
	: T extends undefined | ((...args: any[]) => any)
		? never
		: T extends Date
			? string
			: T extends Array<infer Item>
				? Array<Jsonify<Item>>
				: T extends object
					? {
							[
								Key in keyof T as T[Key] extends undefined | ((...args: any[]) => any) ? never : Key
							]: Jsonify<T[Key]>;
						}
					: T;
