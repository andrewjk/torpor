import type ServerLoadEvent from "./ServerLoadEvent";

type ServerRequest = (
	event: ServerLoadEvent,
) => Response | undefined | void | Promise<Response | undefined | void>;

export default ServerRequest;
