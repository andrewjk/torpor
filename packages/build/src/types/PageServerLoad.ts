import type ServerEvent from "./ServerEvent";

type PageServerLoad = (event: ServerEvent) => Response | Promise<Response | undefined> | void;
export default PageServerLoad;
