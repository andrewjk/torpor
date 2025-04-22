export default function createComment(content?: string): Comment {
	return document.createComment(content || "");
}
