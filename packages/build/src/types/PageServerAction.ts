import type ServerLoadEvent from "./ServerLoadEvent";

type PageServerAction = (
	event: ServerLoadEvent,
) => Response | Promise<Response | undefined> | Promise<void> | void;

export default PageServerAction;
