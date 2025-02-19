import buildRoutePath from "./site/buildRoutePath";
import defineConfig from "./site/defineConfig";
import type CookieHelper from "./types/CookieHelper";
import type PageEndPoint from "./types/PageEndPoint";
import type PageEvent from "./types/PageEvent";
import type PageServerAction from "./types/PageServerAction";
import type PageServerEndPoint from "./types/PageServerEndPoint";
import type PageServerLoad from "./types/PageServerLoad";
import type ServerEndPoint from "./types/ServerEndPoint";
import type ServerEvent from "./types/ServerEvent";
import type ServerHook from "./types/ServerHook";
import type ServerRequest from "./types/ServerRequest";
import type UserConfig from "./types/UserConfig";

// NOTE: Do not export anything that relies on vinxi/vite from here, or it will
// cause problems when they are re-imported when routes are lazily loaded

export { defineConfig, buildRoutePath };

export type {
	UserConfig,
	PageEndPoint,
	PageServerEndPoint,
	PageServerLoad,
	PageServerAction,
	ServerEndPoint,
	ServerRequest,
	ServerHook,
	PageEvent,
	ServerEvent,
	CookieHelper,
};
