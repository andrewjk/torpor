import commentsDelete from "@/lib/api/controllers/comments/commentsDelete";
import type { ApiServerEndPoint } from "@tera/kit";

export default {
	del: ({ params, request }) => {
		return commentsDelete(params, request);
	},
} satisfies ApiServerEndPoint;
