import { deleteComment } from "@/lib/api/controllers/commentsController";
import type { ApiServerEndPoint } from "@tera/kit";

export default {
	del: ({ params, request }) => {
		return deleteComment(params, request);
	},
} satisfies ApiServerEndPoint;
