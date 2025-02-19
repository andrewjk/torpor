import type ServerEvent from "./ServerEvent";

type ServerRequest = (event: ServerEvent) => Response | Promise<Response | undefined> | void;
export default ServerRequest;
