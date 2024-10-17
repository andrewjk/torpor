import ServerParams from "./ServerParams";

export default interface ServerEndPoint {
	load?: ServerLoad;
	actions?: Record<string, ServerAction>;
}

type ServerLoad = (params: ServerParams) => Response | Promise<Response | undefined> | void;
type ServerAction = (params: ServerParams) => Response | Promise<Response | undefined> | void;
