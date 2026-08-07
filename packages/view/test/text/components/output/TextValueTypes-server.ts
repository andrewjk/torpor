import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function TextValues(
	$props: { str: string; num: number; bool: boolean; nullVal: null; undefVal: undefined; zero: number; negNum: number; nan: number },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<p id="str">${t_fmt($props.str)}</p> <p id="num">${t_fmt($props.num)}</p> <p id="bool">${t_fmt($props.bool)}</p> <p id="null">${t_fmt($props.nullVal)}</p> <p id="undef">${t_fmt($props.undefVal)}</p> <p id="zero">${t_fmt($props.zero)}</p> <p id="neg">${t_fmt($props.negNum)}</p> <p id="nan">${t_fmt($props.nan)}</p>`;

	return { body: t_body, head: t_head };
}
