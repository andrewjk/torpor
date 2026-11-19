import makeApi from "./nav/api";
import load from "./nav/load";
import reload from "./nav/reload";
import route from "./nav/route";
import type { NavigationFailureDetail } from "./nav/navigationFailure";
import { DATA_REUSE_HEADER, DATA_REQUEST_HEADER } from "./dataRequest";

declare global {
	interface WindowEventMap {
		"torpor:navigation-failed": CustomEvent<NavigationFailureDetail>;
	}
}

export { load, reload, route, makeApi, DATA_REQUEST_HEADER, DATA_REUSE_HEADER };
export type { NavigationFailureDetail };
