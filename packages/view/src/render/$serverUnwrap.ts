export default function $serverUnwrap<T extends Record<PropertyKey, any>>(object: T): T {
	return object;
}
