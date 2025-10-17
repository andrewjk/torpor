import $mount from "../render/$mount";
import type Cleanup from "../types/Cleanup";

export default function $debugMount(fn: () => Cleanup | void): void {
	return $mount(fn);
}
