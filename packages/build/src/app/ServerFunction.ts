import ServerEvent from "./ServerEvent";

type ServerFunction = (e: ServerEvent) => Response | Promise<Response>;
export default ServerFunction;
