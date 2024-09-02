import "vinxi/client";
import type Component from "../../view/src/compile/types/Component";
import hydrate from "../../view/src/render/hydrate";

console.log("hydrating client at", document.location);

// TODO: Router here from routes
// TODO: Get the component and put it in the slot
let view: Component | null = null;
switch (document.location.pathname.toLocaleLowerCase()) {
	case "/": {
		let component = await import("../client/Index.tera");
		view = component.default;
		break;
	}
	case "/party": {
		let component = await import("../client/Party.tera");
		view = component.default;
		break;
	}
}

// Maybe from params??
let $props: Record<string, any> = {};

if (view) {
	const parent = document.getElementById("app");
	if (parent) {
		hydrate(parent, view, $props);
	} else {
		// TODO: 500
	}
} else {
	// TODO: 404
}
