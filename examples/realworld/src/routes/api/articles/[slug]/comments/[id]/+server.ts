import commentsDelete from "@/lib/api/controllers/comments/commentsDelete";
import { type ServerEndPoint } from "@torpor/build";

export default {
	del: ({ params, request }) => {
		return commentsDelete(params, request);
	},
} satisfies ServerEndPoint;
