import { clearLayoutSlot, fillLayoutSlot, hydrate } from "@torpor/view";
import { type Component, type SlotRender } from "@torpor/view";
import { mount } from "@torpor/view";
import $page from "../state/$page";
import client from "../state/client";
import type LayoutPath from "../types/LayoutPath";
import type PageEndPoint from "../types/PageEndPoint";
import type PageServerEndPoint from "../types/PageServerEndPoint";
import formSubmit from "./formSubmit";
import loadData from "./loadData";

// @ts-ignore
export default async function navigate(url: URL, withHydration = false): Promise<boolean> {
	let parent = document.getElementById("app");
	if (!parent) {
		// TODO: 500
		console.log("500");
		return false;
	}

	const path = url.pathname;
	const query = url.searchParams;

	//console.log(`navigating to '${path}'${query.size ? ` with ${query}` : ""}`);

	const route = client.router.match(path, query);
	if (!route) {
		// TODO: 404
		console.log("404");
		return false;
	}

	// Update $page before building the components
	$page.url = url;
	if (path.endsWith("/_error")) {
		$page.status = parseInt(query.get("status") ?? "404");
		$page.error = { message: query.get("message") ?? "" };
		// Make it look a bit classier by removing the query
		window.history.replaceState({}, "", url.toString().split("?")[0]);
	} else {
		$page.status = 200;
	}
	const handler = route.handler;
	const params = route.params || {};

	// There must be a client endpoint with a component
	const clientEndPoint: PageEndPoint | undefined = (await handler.endPoint()).default;
	if (!clientEndPoint?.component) {
		// TODO: 404
		console.log("404");
		return false;
	}

	// There may be a server endpoint
	const serverEndPoint: PageServerEndPoint | undefined =
		handler.serverEndPoint && (await handler.serverEndPoint())?.default;

	let newLayoutStack: LayoutPath[] = [];

	// Pass the data into $props
	// TODO: Don't load if this is the first time -- it should have been passed
	// to us, somehow...
	const data = await loadData(
		handler,
		params,
		path,
		query,
		newLayoutStack,
		clientEndPoint,
		serverEndPoint,
	);
	// We may have form data in a hidden input -- not sure if this is the best
	// way to do it
	let formInput = document.getElementById("t-form-data") as HTMLInputElement;
	let form: Record<string, string> | undefined;
	if (formInput) {
		form = JSON.parse(formInput.value);
		$page.form = form;
		formInput.remove();
	}
	let $props: Record<string, any> = { data };

	// We may have form data in $page.form, either from the hidden input
	// (above), or added via onformsubmit (below)
	$props.form = $page.form;

	// Add some special context for submitting Forms client-side
	const $context = {
		TorporBuildContext: { onformsubmit: formSubmit },
	};

	client.layoutStack.push({ path: route.handler.path, data: {}, reuse: false, slotRegion: null });
	client.layoutStack = newLayoutStack;
	let layoutStack = client.layoutStack;

	// If there are layouts, work our way upwards, pushing each component into
	// the default slot of its parent
	// TODO: There's probably a nicer way to do this with reducers or something
	let component = clientEndPoint.component as Component;
	let slots: Record<string, SlotRender> | undefined = undefined;
	if (handler.layouts) {
		let slotFunctions: SlotRender[] = [];
		// The last slot function will render the client component
		slotFunctions[handler.layouts.length] = function clientComponent(parent, anchor) {
			let i = layoutStack.length - 1;
			layoutStack[i].slotRegion = fillLayoutSlot(
				clientEndPoint.component!,
				slotFunctions[i + 1],
				parent,
				anchor,
				$props,
				$context,
			);
		};

		// Each earlier slot function will render a layout
		for (let i = handler.layouts.length - 1; i >= 0; i--) {
			const layoutEndPoint: PageEndPoint | undefined = (await handler.layouts[i].endPoint())
				?.default;
			if (layoutEndPoint?.component) {
				if (layoutStack[i].reuse) {
					// Set the parent to add the new content to (from the old
					// content), clear the range under this point, and set the
					// component to the slot function within this layout
					parent = layoutStack[i].slotRegion.startNode.parentNode as HTMLElement;
					clearLayoutSlot(layoutStack[i].slotRegion);
					component = slotFunctions[i + 1];
					break;
				} else if (i === 0) {
					component = layoutEndPoint.component as Component;
					slots = { _: slotFunctions[i + 1] };
				} else {
					slotFunctions[i] = function layoutComponent(parent, anchor, _, $context) {
						layoutStack[i - 1].slotRegion = fillLayoutSlot(
							layoutEndPoint.component!,
							slotFunctions[i + 1],
							parent,
							anchor,
							$props,
							$context,
						);
					};
				}
			}
		}
	}

	if (withHydration) {
		hydrate(parent, component, $props, slots);
	} else {
		try {
			mount(parent, component, $props, slots);
		} catch (error) {
			// TODO: Show a proper Error component
			parent.innerHTML = '<span style="color: red">Script syntax error</span><p>' + error + "</p>";
			console.log(error);
		}
	}

	// Reset prefetched data on each navigation
	client.prefetchedData = {};

	return true;
}
