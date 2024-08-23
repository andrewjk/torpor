import $mount from '../../../../../tera/view/src/watch/$mount';
import t_fragment from '../../../../../tera/view/src/render/internal/getFragment';
import t_root from '../../../../../tera/view/src/render/internal/nodeRoot';
import t_apply_props from '../../../../../tera/view/src/render/internal/applyProps';
import t_add_fragment from '../../../../../tera/view/src/render/internal/addFragment';
import t_next from '../../../../../tera/view/src/render/internal/nodeNext';
import t_flush from '../../../../../tera/view/src/watch/internal/flushMountEffects';

const Mount = {
  name: "Mount",
  /**
  * @param {Node} $parent
  * @param {Node | null} $anchor
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($parent, $anchor, $props, $slots, $context) => {
    /* User script */
    let inputElement;

    $mount(() => {
      inputElement.value = "hi";
    });
    
    /* User interface */
    const t_fragments = [];

    const t_fragment_0 = t_fragment(t_fragments, 0, `<input></input>`);
    const t_input_1 = t_root(t_fragment_0);

    t_apply_props(t_input_1, $props, []);
    inputElement = t_input_1;
    t_add_fragment(t_fragment_0, $parent, $anchor);
    t_next(t_input_1);

    t_flush();
  }
}

export default Mount;
