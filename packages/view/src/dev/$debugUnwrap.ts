import $unwrap from "../render/$unwrap";

export default function $debugUnwrap<T extends Record<PropertyKey, any>>(object: T): T {
	return $unwrap(object);
}
