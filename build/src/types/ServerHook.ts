import ServerParams from "./ServerParams";

export default interface ServerHook {
	handle?: ServerLoad;
}

type ServerLoad = (params: ServerParams) => Promise<void> | void;
