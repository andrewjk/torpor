import $unwrap from "../watch/$unwrap";

export default function formatText(value: any): string {
	// We could have anything in value, so we need to
	// - use String(...) because Symbols can't be implicitly converted
	// - use $unwrap because Proxies can't be converted to a string
	if (value === undefined || value === null) {
		return "";
	}
	// Fast path: strings already satisfy both concerns above. Skipping the
	// `String($unwrap(value))` pair saves two function calls per text
	// interpolation on the dominant `typeof value === "string"` branch —
	// e.g. row labels in js-framework-bench hit this on every effect run.
	if (typeof value === "string") {
		return value;
	}
	return String($unwrap(value));
}
