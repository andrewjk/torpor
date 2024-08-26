export default function createComment(content?: string) {
	return document.createComment(content || "");
}
