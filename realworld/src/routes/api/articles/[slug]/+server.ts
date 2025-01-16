import articlesDelete from "@/lib/api/controllers/articles/articlesDelete";
import articlesGet from "@/lib/api/controllers/articles/articlesGet";
import articlesUpdate from "@/lib/api/controllers/articles/articlesUpdate";
import type { ServerEndPoint } from "@torpor/build";

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
} satisfies ServerEndPoint;
