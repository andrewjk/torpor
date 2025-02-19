import type ServerEvent from "./ServerEvent";

type PageServerAction = (event: ServerEvent) => Response | Promise<Response | undefined> | void;
export default PageServerAction;
