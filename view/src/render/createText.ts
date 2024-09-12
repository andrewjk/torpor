export default function createText(content: string) {
	return document.createTextNode(isReactiveText(content) ? " " : content);
}

function isReactiveText(content: string) {
	// TODO: Need to be more fancy (check that braces match, ignore comments and strings etc)
	return content.includes("{") && content.includes("}");
}
