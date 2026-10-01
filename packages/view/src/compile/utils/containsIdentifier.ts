/**
 * Whether `name` appears in `value` as a standalone identifier (not as part
 * of a longer identifier or a property access). Used to decide which loop
 * variables a chunk of generated code actually references.
 */
export default function containsIdentifier(value: string, name: string): boolean {
	const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`(?<![\\w$])${escaped}(?![\\w$])`).test(value);
}
