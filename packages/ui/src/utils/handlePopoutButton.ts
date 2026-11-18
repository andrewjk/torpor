/** Minimal state shared by popout roots */
interface PopoutStateLike {
	visible: boolean;
}

/**
 * The common button-result handling for popouts: confirm/cancel buttons
 * resolve to true/false (or the value they supply), other buttons supply
 * their value, and every button hides the popout.
 *
 * Components keep their own `visible` state so that bindings and callbacks
 * stay on the component's reactive object.
 */
export function createPopoutButtonHandler(state: PopoutStateLike): {
	handleButton: (type: "confirm" | "cancel" | undefined, value?: any) => void;
	getResult: () => any;
} {
	let result: any;

	function handleButton(type: "confirm" | "cancel" | undefined, value?: any) {
		switch (type) {
			case "confirm": {
				result = value ?? true;
				break;
			}
			case "cancel": {
				result = value ?? false;
				break;
			}
			default: {
				result = value;
				break;
			}
		}

		state.visible = false;
	}

	return {
		handleButton,
		getResult: () => result,
	};
}
