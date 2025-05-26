export default function buildItems(itemCount: number): string[] {
	let newItems: string[] = [];
	for (let i = 1; i <= itemCount; i++) {
		let text = "The ";
		text += i;
		if (i >= 11 && i <= 19) {
			text += "th";
		} else if (text.endsWith("1")) {
			text += "st";
		} else if (text.endsWith("2")) {
			text += "nd";
		} else if (text.endsWith("3")) {
			text += "rd";
		} else {
			text += "th";
		}
		text += " item";
		newItems.push(text);
	}
	return newItems;
}
