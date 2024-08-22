import $run from '../../../../../tera/view/src/watch/$run';
import t_fragment from '../../../../../tera/view/src/render/internal/getFragment';
import t_root from '../../../../../tera/view/src/render/internal/nodeRoot';
import t_apply_props from '../../../../../tera/view/src/render/internal/applyProps';
import t_add_fragment from '../../../../../tera/view/src/render/internal/addFragment';
import t_next from '../../../../../tera/view/src/render/internal/nodeNext';

const InputFocused = {
  name: "InputFocused",
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

    $run(() => {
      inputElement.focus();
    });
    
    /* User interface */
    const t_fragments = [];

    const t_fragment_0 = t_fragment(t_fragments, 0, `<input></input>`);
    const t_input_1 = t_root(t_fragment_0);

    t_apply_props(t_input_1, $props, []);
    $run(function setBinding() {
      t_input_1.this = inputElement || "";
    });
    t_input_1.addEventListener("input", (e) => inputElement = e.target.value);
    t_add_fragment(t_fragment_0, $parent, $anchor);
    t_next(t_input_1);
  }
}

export default InputFocused;
