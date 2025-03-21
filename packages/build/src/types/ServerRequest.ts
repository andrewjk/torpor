import type ServerLoadEvent from "./ServerLoadEvent";

type ServerRequest = (event: ServerLoadEvent) => Response | Promise<Response | undefined> | void;

export default ServerRequest;
