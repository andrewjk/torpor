import $run from "./$run";

export default function applyProps(
	el: Element,
	props: Record<string, any> | undefined,
	propNamesUsed: string[],
): void {
	if (props !== undefined) {
		for (let [name, value] of Object.entries(props)) {
			if (!propNamesUsed.includes(name)) {
				if (name.startsWith("on")) {
					const eventName = name.substring(2);
					el.addEventListener(eventName, value);
				} else {
					$run(function setAttribute() {
						el.setAttribute(name, value);
					});
				}
			}
		}
	}
}
