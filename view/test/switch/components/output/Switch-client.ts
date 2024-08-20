import $watch from '../../../../../tera/view/src/watch/$watch';
import $run from '../../../../../tera/view/src/watch/$run';
import t_push_range_to_parent from '../../../../../tera/view/src/render/internal/pushRangeToParent';
import t_push_range from '../../../../../tera/view/src/render/internal/pushRange';
import t_pop_range from '../../../../../tera/view/src/render/internal/popRange';
import t_run_control from '../../../../../tera/view/src/render/internal/runControl';
import t_run_branch from '../../../../../tera/view/src/render/internal/runControlBranch';
import t_run_list from '../../../../../tera/view/src/render/internal/runList';
import t_add_fragment from '../../../../../tera/view/src/render/internal/addFragment';
import t_apply_props from '../../../../../tera/view/src/render/internal/applyProps';
import t_fmt from '../../../../../tera/view/src/render/internal/formatText';
import t_fragment from '../../../../../tera/view/src/render/internal/getFragment';
import t_anchor from '../../../../../tera/view/src/render/internal/findAnchor';
import t_root from '../../../../../tera/view/src/render/internal/nodeRoot';
import t_child from '../../../../../tera/view/src/render/internal/nodeChild';
import t_next from '../../../../../tera/view/src/render/internal/nodeNext';
const Switch = {
  name: "Switch",
  /**
  * @param {Node} $parent
  * @param {Node | null} $anchor
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($parent, $anchor, $props, $slots, $context) => {
    /* User interface */
    const t_fragments = [];

    const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <!> </div>`);
    const t_root_0 = t_root(t_fragment_0);
    const t_div_1 = t_root_0;
    const t_switch_parent_1 = t_root(t_fragment_0);
    const t_switch_anchor_1 = t_anchor(t_next(t_child(t_div_1)));

    /* @switch */
    const t_switch_range_1 = {};
    t_run_control(t_switch_range_1, t_switch_anchor_1, (t_before) => {
      switch ($props.value) {
        case 1: {
          t_run_branch(t_switch_range_1, 0, () => {
            const t_fragment_1 = t_fragment(t_fragments, 1, ` <p> A small value. </p> `);
            const t_root_1 = t_root(t_fragment_1);
            const t_text_1 = t_next(t_next(t_root_1));
            t_add_fragment(t_fragment_1, t_switch_parent_1, t_before);
            t_next(t_text_1);
          });
          break;
        }
        case 100: {
          t_run_branch(t_switch_range_1, 1, () => {
            const t_fragment_2 = t_fragment(t_fragments, 2, ` <p> A large value. </p> `);
            const t_root_2 = t_root(t_fragment_2);
            const t_text_2 = t_next(t_next(t_root_2));
            t_add_fragment(t_fragment_2, t_switch_parent_1, t_before);
            t_next(t_text_2);
          });
          break;
        }
        default: {
          t_run_branch(t_switch_range_1, 2, () => {
            const t_fragment_3 = t_fragment(t_fragments, 3, ` <p> Another value. </p> `);
            const t_root_3 = t_root(t_fragment_3);
            const t_text_3 = t_next(t_next(t_root_3));
            t_add_fragment(t_fragment_3, t_switch_parent_1, t_before);
            t_next(t_text_3);
          });
          break;
        }
      }
    });


    t_apply_props(t_div_1, $props, ['value']);
    t_add_fragment(t_fragment_0, $parent, $anchor);
    t_next(t_div_1);
  }
}

export default Switch;
