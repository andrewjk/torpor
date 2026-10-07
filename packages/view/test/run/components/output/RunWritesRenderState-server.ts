import $run from "../../../../src/ssr/$serverRun";
import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function RunWritesRenderState(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ a: 2, b: 0, on: false });
	$run(() => {
		$state.b = $state.a * 2;
		$state.on = $state.a > 1;
	});

	/* User interface */
	t_body += `<p class="b">${t_fmt($state.b)}</p> <![>`;
	if ($state.on) {
		t_body += `<!^><div class="branch">on</div>`;
	}
	else {
		t_body += `<!^><div class="branch">off</div>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
