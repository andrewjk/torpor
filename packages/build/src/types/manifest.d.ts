import type MiddlewareFunction from "../server/types/MiddlewareFunction";
import type ManifestRoute from "./ManifestRoute";
import type ModulePreloads from "./ModulePreloads";

declare const manifest: {
	base: string;
	viewTransitions?: boolean;
	middleware?: MiddlewareFunction[];
	routes: ManifestRoute[];
	/** The client chunks each page needs (production server builds only). */
	preloads?: ModulePreloads;
	/** True when running under the dev server (`tb --dev`). */
	dev?: boolean;
};

export default manifest;
