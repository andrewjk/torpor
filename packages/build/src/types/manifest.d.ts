import type MiddlewareFunction from "../server/types/MiddlewareFunction";
import type ManifestRoute from "./ManifestRoute";

declare const manifest: {
	base: string;
	viewTransitions?: boolean;
	middleware?: MiddlewareFunction[];
	routes: ManifestRoute[];
	/** True when running under the dev server (`tb --dev`). */
	dev?: boolean;
};

export default manifest;
