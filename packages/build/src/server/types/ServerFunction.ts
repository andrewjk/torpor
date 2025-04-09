import ServerEvent from "../ServerEvent";

type ServerFunction = (e: ServerEvent) => Response | Promise<Response | undefined> | undefined;

export default ServerFunction;
