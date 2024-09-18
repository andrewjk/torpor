import { $run } from '@tera/view';
import { $watch } from '@tera/view';
import { t_add_fragment } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_child } from '@tera/view';
import { t_fmt } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_root } from '@tera/view';

const PageTitle = {
	name: "PageTitle",
	/**
	 * @param {Node} $parent
	 * @param {Node | null} $anchor
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($parent, $anchor, $props, $context, $slots) => {
		/* User script */
		let $state = $watch({
			pageTitle: ""
		});
		$run(() => {
			$state.pageTitle = document.title;
		});
		
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<p>#</p>`);
		const t_p_1 = t_root(t_fragment_0);
		const t_text_1 = t_child(t_p_1);

		t_apply_props(t_p_1, $props, []);
		$run(function setTextContent() {
			t_text_1.textContent = `Page title: ${t_fmt($state.pageTitle)}`;
		});
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default PageTitle;
