import { Comment, User } from "@prisma/client";
import profileView from "./profileView";

export default function commentView(
	comment: Comment & { author: User & { followedBy: User[] } },
	currentUser?: User,
) {
	const commentView = {
		id: comment.id,
		createdAt: comment.createdAt,
		updatedAt: comment.updatedAt,
		body: comment.body,
		author: profileView(comment.author, currentUser),
	};
	return commentView;
}
