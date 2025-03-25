import type ServerLoadEvent from "./ServerLoadEvent";

type ServerRequest = (
	event: ServerLoadEvent,
) => Response | Promise<Response | undefined> | Promise<void> | void;

export default ServerRequest;
