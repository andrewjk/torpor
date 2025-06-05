export const PAGE_ROUTE = 0;
export const PAGE_SERVER_ROUTE = 1;
export const SERVER_ROUTE = 3;
export const LAYOUT_ROUTE = 4;
export const LAYOUT_SERVER_ROUTE = 5;
export const HOOK_ROUTE = 6;
export const HOOK_SERVER_ROUTE = 7;
export const ERROR_ROUTE = 8;

export type RouteType =
	| typeof PAGE_ROUTE
	| typeof PAGE_SERVER_ROUTE
	| typeof SERVER_ROUTE
	| typeof LAYOUT_ROUTE
	| typeof LAYOUT_SERVER_ROUTE
	| typeof HOOK_ROUTE
	| typeof HOOK_SERVER_ROUTE
	| typeof ERROR_ROUTE
	| -1;
