import type SlotRender from "@tera/view";
import AnswerButton from './AnswerButton.tera';

const AnswerButtonApp = {
	/**
	 * The component's name.
	 */
	name: "AnswerButtonApp",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		/* User script */
		const $watch = (obj) => obj;
		let $state = $watch({
			isHappy: true
		});

		function onAnswerNo() {
			$state.isHappy = false;
		}

		function onAnswerYes() {
			$state.isHappy = true;
		}
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<div> <p>Are you happy?</p> `;
		const t_props_1 = {};
		t_props_1["onYes"] = onAnswerYes;
		t_props_1["onNo"] = onAnswerNo;

		$output += AnswerButton.render(t_props_1, $context)
		$output += ` <p style="font-size: 50px;">${t_fmt($state.isHappy ? "😀" : "😥")}</p> </div>`;
		return $output;
	}
}

export default AnswerButtonApp;
