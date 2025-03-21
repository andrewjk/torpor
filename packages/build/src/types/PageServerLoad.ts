import type ServerLoadEvent from "./ServerLoadEvent";

type PageServerLoad = (event: ServerLoadEvent) => Response | Promise<Response | undefined> | void;

export default PageServerLoad;
