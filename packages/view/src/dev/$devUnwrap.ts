import $unwrap from "../watch/$unwrap";

export default function $devUnwrap<T extends Record<PropertyKey, any>>(object: T): T {
	return $unwrap(object);
}
