import $unwrap from "../watch/$unwrap";

export default function formatText(value: any): string {
	// We could have anything in value, so we need to
	// - use String(...) because Symbols can't be implicitly converted
	// - use $unwrap because Proxies can't be converted to a string
	return value === undefined || value === null ? "" : String($unwrap(value));
}
