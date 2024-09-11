import type Cleanup from "./Cleanup";
import type ProxyPropData from "./ProxyPropData";
import type Range from "./Range";

export default interface Effect {
	run: () => Cleanup | void;
	cleanup: Cleanup | null;

	range: Range | null;
	props: ProxyPropData[] | null;
}
