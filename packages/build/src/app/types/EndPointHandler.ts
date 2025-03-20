import type LayoutHandler from "./LayoutHandler";

type EndPointHandler = {
	path: string;

	// We can't load this stuff until Vite is active
	loaded?: boolean;
	endPoint?: Promise<any>;
	layouts?: LayoutHandler[];
	serverEndPoint?: Promise<any>;
	serverHook?: Promise<any>;
};

export default EndPointHandler;
