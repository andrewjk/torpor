import type ServerLoadEvent from "./ServerLoadEvent";

type PageServerLoad = (
	event: ServerLoadEvent,
) => Response | Promise<Response | undefined> | Promise<void> | void;

export default PageServerLoad;
