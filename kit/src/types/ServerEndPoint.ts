import ServerParams from "./ServerParams";

export default interface ServerEndPoint {
	load?: ServerLoad;
	actions?: Record<string, ServerAction>;
}

type ServerLoad = (params: ServerParams) => any;
type ServerAction = (params: ServerParams) => any;
