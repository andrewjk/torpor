import Router from "./site/Router";
import Site from "./site/Site";
import type Adapter from "./types/Adapter";
import type { Jsonify } from "./types/Jsonify";
import type { MergePageData, PageData } from "./types/PageData";
import type { PageForm } from "./types/PageForm";
import type PageEndPoint from "./types/PageEndPoint";
import type PageLoadEvent from "./types/PageLoadEvent";
import type { PageLoadReturn } from "./types/PageLoadReturn";
import type PageProps from "./types/PageProps";
import type {
	ParseRouteParams,
	RouteArgs,
	RouteArgsOf,
	RouteParamsOf,
} from "./types/ParseRouteParams";
import type PageServerAction from "./types/PageServerAction";
import type PageServerEndPoint from "./types/PageServerEndPoint";
import type PageServerLoad from "./types/PageServerLoad";
import type TypedResponse from "./response/TypedResponse";
import type { UntypedResponse } from "./response/TypedResponse";
import type ServerEndPoint from "./types/ServerEndPoint";
import type { ServerEndPointSchemas } from "./types/ServerEndPoint";
import type ServerHook from "./types/ServerHook";
import type ServerLoadEvent from "./types/ServerLoadEvent";
import type ServerRequest from "./types/ServerRequest";
import type { StandardSchemaV1 } from "./types/StandardSchema";

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
	ServerEndPointSchemas,
	ServerRequest,
	ServerHook,
	ServerLoadEvent,
	StandardSchemaV1,
	PageLoadEvent,
	ParseRouteParams,
	RouteArgs,
	RouteArgsOf,
	RouteParamsOf,
	Jsonify,
	TypedResponse,
	UntypedResponse,
	PageData,
	MergePageData,
	PageForm,
	PageLoadReturn,
	PageProps,
};
