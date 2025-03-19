import ServerEvent from "./ServerEvent";

type MiddlewareFunction = (
	ev: ServerEvent,
	next: () => void | Promise<void>,
) => void | Promise<void>;
export default MiddlewareFunction;
