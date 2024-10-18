import {
	articlesDelete,
	articlesGet,
	articlesUpdate,
} from "@/lib/api/controllers/articlesController";
import type { ApiServerEndPoint } from "@tera/kit";

export default {
	get: ({ params, request }) => {
		return articlesGet(params, request);
	},
	put: ({ params, appData, request }) => {
		return articlesUpdate(params, appData, request);
	},
	del: ({ params, request }) => {
		return articlesDelete(params, request);
	},
} satisfies ApiServerEndPoint;
