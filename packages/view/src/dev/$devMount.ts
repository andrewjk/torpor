import type Cleanup from "../types/Cleanup";
import $mount from "../watch/$mount";

export default function $devMount(fn: () => Cleanup | void): void {
	return $mount(fn);
}
