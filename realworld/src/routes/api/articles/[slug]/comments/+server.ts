import { createComment, getComments } from "@/lib/api/controllers/commentsController";
import type { ApiServerEndPoint } from "@tera/kit";

export default {
	get: ({ params, request }) => {
		return getComments(params, request);
	},
	post: ({ params, appData, request }) => {
		return createComment(params, appData, request);
	},
} satisfies ApiServerEndPoint;
