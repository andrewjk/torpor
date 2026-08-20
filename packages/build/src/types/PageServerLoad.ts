import type ServerLoadEvent from "./ServerLoadEvent";
import type { PageLoadReturn } from "./PageLoadReturn";

type PageServerLoad<Route extends string | undefined = undefined, Data = Record<string, any>> = (
	event: ServerLoadEvent<Route>,
) => PageLoadReturn<Data> | Promise<PageLoadReturn<Data>>;

export default PageServerLoad;
