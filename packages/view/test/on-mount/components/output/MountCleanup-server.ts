import $mount from "../../../../src/ssr/$serverMount";
import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function MountCleanupReturn(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ mounted: false })

	$mount(() => {
		$state.mounted = true
		window.__mountLog.push("mount")
		return () => {
			window.__mountLog.push("cleanup")
		}
	})

	/* User interface */
	t_body += ` <p>Mounted: ${t_fmt($state.mounted)}</p> `;

	return { body: t_body, head: t_head };
}
