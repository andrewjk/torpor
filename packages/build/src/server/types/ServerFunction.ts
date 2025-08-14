import ServerEvent from "../ServerEvent";

type ServerFunction = (
	e: ServerEvent,
) => Response | undefined | void | Promise<Response | undefined | void>;

export default ServerFunction;
