import type ServerLoadEvent from "./ServerLoadEvent";

type PageServerAction = (event: ServerLoadEvent) => Response | Promise<Response | undefined> | void;

export default PageServerAction;
