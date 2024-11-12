import ServerParams from "./ServerParams";

export default interface ServerEndPoint {
	get?: ServerRequest;
	post?: ServerRequest;
	patch?: ServerRequest;
	put?: ServerRequest;
	del?: ServerRequest;
	options?: ServerRequest;
	head?: ServerRequest;
}

type ServerRequest = (params: ServerParams) => Response | Promise<Response | undefined> | void;
