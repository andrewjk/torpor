import commentsCreate from "@/lib/api/controllers/comments/commentsCreate";
import commentsGet from "@/lib/api/controllers/comments/commentsGet";
import type { ApiServerEndPoint } from "@tera/kit";

export default {
	get: ({ params, request }) => {
		return commentsGet(params, request);
	},
	post: ({ params, appData, request }) => {
		return commentsCreate(params, appData, request);
	},
} satisfies ApiServerEndPoint;
