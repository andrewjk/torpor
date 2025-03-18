import ServerEvent from "./ServerEvent";

type ServerFunction = (e: ServerEvent) => Response;
export default ServerFunction;
