import type ServerLoadEvent from "./ServerLoadEvent";

type PageServerLoad<Route extends string | undefined = undefined> = (
	event: ServerLoadEvent<Route>,
) => Response | undefined | void | Promise<Response | undefined | void>;

export default PageServerLoad;
