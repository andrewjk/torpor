import $run from "../../../../src/ssr/$serverRun";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function CleanupIfInsideFor(
	$props: { show: boolean; items: string[] },
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let item of $props.items) {
		t_body += `<!^><![>`;
		if ($props.show) {
			t_body += `<!^><![>`;
			const t_comp_1 = CleanupTracker(undefined, $context);
			t_body += t_comp_1.body;
			t_head += t_comp_1.head;
			t_body += `<!]><!>`;
		}
		t_body += `<!]><!>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}

function CleanupTracker(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	$run(() => {
		window.__cleanupLog.push("effect");
		return () => {
			window.__cleanupLog.push("cleanup");
		};
	});

	/* User interface */
	t_body += `<p>Tracked</p>`;

	return { body: t_body, head: t_head };
}
