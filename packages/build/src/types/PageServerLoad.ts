import type ServerLoadEvent from "./ServerLoadEvent";

type PageServerLoad = (
	event: ServerLoadEvent,
) => Response | undefined | void | Promise<Response | undefined | void>;

export default PageServerLoad;
