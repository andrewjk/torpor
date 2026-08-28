import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function ForTemplateLiteral($props: { slides: { index: number }[] }) {
	@render {
		<section>
			@for (let slide of $props.slides) {
				<p aria-label={\`Go to slide \${slide.index + 1}\`}>Slide</p>
				<p aria-label={\`slide show\`}>Constant</p>
			}
		</section>
	}
}
`;

function labels(container: HTMLElement): (string | null)[] {
	return [...container.querySelectorAll("p")].map((p) => p.getAttribute("aria-label"));
}

test("for template literal -- mounted", async () => {
	let $state = $watch({ slides: [{ index: 0 }, { index: 1 }, { index: 2 }] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(labels(container)).toEqual([
		"Go to slide 1",
		"slide show",
		"Go to slide 2",
		"slide show",
		"Go to slide 3",
		"slide show",
	]);

	$state.slides = [{ index: 3 }, { index: 4 }];
	expect(labels(container)).toEqual(["Go to slide 4", "slide show", "Go to slide 5", "slide show"]);
});

test("for template literal -- hydrated", async () => {
	let $state = $watch({ slides: [{ index: 0 }, { index: 1 }] });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(labels(container)).toEqual(["Go to slide 1", "slide show", "Go to slide 2", "slide show"]);
});
