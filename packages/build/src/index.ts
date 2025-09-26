import Router from "./site/Router";
import Site from "./site/Site";
import type Adapter from "./types/Adapter";
import type PageEndPoint from "./types/PageEndPoint";
import type PageLoadEvent from "./types/PageLoadEvent";
import type PageServerAction from "./types/PageServerAction";
import type PageServerEndPoint from "./types/PageServerEndPoint";
import type PageServerLoad from "./types/PageServerLoad";
import type ServerEndPoint from "./types/ServerEndPoint";
import type ServerHook from "./types/ServerHook";
import type ServerLoadEvent from "./types/ServerLoadEvent";
import type ServerRequest from "./types/ServerRequest";

// NOTE: Don't export any general functionality from here -- it may result in
// Vite errors like `Could not resolve '../pkg' in lightningcss` etc

export { Site, Router };

export type {
	Adapter,
	PageEndPoint,
	PageServerEndPoint,
	PageServerLoad,
	PageServerAction,
	ServerEndPoint,
	ServerRequest,
	ServerHook,
	PageLoadEvent,
	ServerLoadEvent,
};
