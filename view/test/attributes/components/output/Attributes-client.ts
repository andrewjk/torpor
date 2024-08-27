import t_fragment from '../../../../../tera/view/src/render/internal/getFragment';
import t_root from '../../../../../tera/view/src/render/internal/nodeRoot';
import t_apply_props from '../../../../../tera/view/src/render/internal/applyProps';
import t_attribute from '../../../../../tera/view/src/render/internal/setAttribute';
import $run from '../../../../../tera/view/src/watch/$run';
import t_add_fragment from '../../../../../tera/view/src/render/internal/addFragment';
import t_next from '../../../../../tera/view/src/render/internal/nodeNext';

const Attributes = {
  name: "Attributes",
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

    const t_fragment_0 = t_fragment(t_fragments, 0, `<div data-thing=""> Hello! </div>`);
    const t_div_1 = t_root(t_fragment_0);

    t_apply_props(t_div_1, $props, ['thing', 'dataThing']);
    $run(function setAttribute() {
      t_attribute(t_div_1, "thing", $props.thing);
    });
    $run(function setDataAttribute() {
      t_attribute(t_div_1, "data-thing", $props.dataThing);
    });
    t_add_fragment(t_fragment_0, $parent, $anchor);
    t_next(t_div_1);
  }
}

export default Attributes;
