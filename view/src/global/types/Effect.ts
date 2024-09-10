import type Cleanup from "./Cleanup";
import type ProxyPropState from "./ProxyPropState";
import type Range from "./Range";

export default interface Effect {
	run: () => Cleanup | void;
	cleanup: Cleanup | null;

	range: Range | null;
	props: ProxyPropState[] | null;
}
