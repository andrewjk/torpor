import type ServerLoadEvent from "./ServerLoadEvent";

type PageServerAction = (
	event: ServerLoadEvent,
) => Response | undefined | void | Promise<Response | undefined | void>;

export default PageServerAction;
