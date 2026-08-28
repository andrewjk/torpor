import type ServerLoadEvent from "./ServerLoadEvent";

type ServerRequest<Route extends string | undefined = undefined, Body = unknown> = (
	event: ServerLoadEvent<Route, Body>,
) => Response | undefined | void | Promise<Response | undefined | void>;

export default ServerRequest;
