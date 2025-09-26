import Router from "../site/Router";
import type LayoutPath from "./LayoutPath";

export default interface ClientState {
	router: Router;
	layoutStack: LayoutPath[];
	prefetchedData: Record<string, any>;
}
