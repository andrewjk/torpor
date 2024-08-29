import t_fragment from '../../../../../tera/view/src/render/internal/getFragment';
import t_root from '../../../../../tera/view/src/render/internal/nodeRoot';
import t_apply_props from '../../../../../tera/view/src/render/internal/applyProps';
import $run from '../../../../../tera/view/src/watch/$run';
import t_dynamic from '../../../../../tera/view/src/render/internal/setDynamicElement';
import t_add_fragment from '../../../../../tera/view/src/render/internal/addFragment';

const Element = {
  name: "Element",
  /**
  * @param {Node} $parent
  * @param {Node | null} $anchor
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($parent, $anchor, $props, $slots, $context) => {
    $props ||= {};

    /* User interface */
    const t_fragments = [];

    const t_fragment_0 = t_fragment(t_fragments, 0, `<!>`);
    const t_root_0 = t_root(t_fragment_0);
    let t_element_1 = t_root_0;

    t_apply_props(t_element_1, $props, ['tag']);
    $run(function setDynamic() {
      t_element_1 = t_dynamic(t_element_1, $props.tag);
      const t_fragment_1 = t_fragment(t_fragments, 1, ` Hello! `);
      let t_element_2 = t_root(t_fragment_1);
      t_add_fragment(t_fragment_1, t_element_1, null);
    });
    t_add_fragment(t_fragment_0, $parent, $anchor);
  }
}

export default Element;
