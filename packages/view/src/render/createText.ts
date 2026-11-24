import isReactive from "../compile/utils/isReactive";

export default function createText(content: string): Text {
	return document.createTextNode(isReactive(content) ? " " : content);
}
