import type ServerLoadEvent from "./ServerLoadEvent";

type ServerRequest<Route extends string | undefined = undefined> = (
	event: ServerLoadEvent<Route>,
) => Response | undefined | void | Promise<Response | undefined | void>;

export default ServerRequest;
