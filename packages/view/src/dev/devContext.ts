import type DevContext from "./types/DevContext";

const noop = () => {};

const devContext: DevContext = {
	enabled: false,
	depth: 0,
	boundaries: [],

	// Hooks
	onRegionPushed: noop,
	onRegionPopped: noop,
	onRegionCleared: noop,
};

// @ts-ignore
globalThis.T_DEV_CONTEXT = () => {
	// Format devContext for passing to DevTools by stripping out nodes etc
	return {
		boundaries: devContext.boundaries.map((b) => ({
			type: b.type,
			id: b.id,
			name: b.name,
			depth: b.depth,
			//expanded: b.expanded,
			//details: b.details,
		})),
	};
};

// @ts-ignore
globalThis.T_DEV_DETAILS = (id: string) => {
	const boundary = devContext.boundaries.find((b) => b.id === id);
	if (boundary) {
		switch (boundary.type) {
			case "run": {
				return String(boundary.target);
			}
			default: {
				// TODO:
				return "I'm a " + boundary.type;
			}
		}
	}
};

// @ts-ignore
globalThis.T_DEV_UNMARK = () => {
	const el = document.getElementById("t_dev_mark");
	if (el) {
		el.style.display = "none";
	}
};

// @ts-ignore
globalThis.T_DEV_MARK = (id: string) => {
	const boundary = devContext.boundaries.find((b) => b.id === id);
	if (boundary && boundary.target?.startNode && boundary.target?.endNode) {
		let el = document.getElementById("t_dev_mark");
		if (!el) {
			el = document.createElement("div");
			el.id = "t_dev_mark";
			el.style.position = "absolute";
			document.body.append(el);
		}

		const range = document.createRange();
		range.setStartBefore(boundary.target.startNode);
		range.setEndAfter(boundary.target.endNode);
		const rect = range.getBoundingClientRect();

		el.style.display = "block";
		el.style.left = rect.left + "px";
		el.style.top = rect.top + "px";
		el.style.height = rect.height + "px";
		el.style.width = rect.width + "px";
		//el.style.border = "2px solid limegreen";
		el.style.borderRadius = "2px";
		el.style.boxShadow = "rgba(50, 205, 50, 0.5) 0px 0px 0px 3px";
	}
};

export default devContext;
