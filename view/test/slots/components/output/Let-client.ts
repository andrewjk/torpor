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
import List from './List.tera';

const Let = {
  name: "Let",
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

    const t_fragment_0 = t_fragment(t_fragments, 0, `<!>`);
    const t_root_0 = t_root(t_fragment_0);
    const t_comp_anchor_1 = t_anchor(t_root_0);

    /* @component */
    const t_props_1 = $watch({});
    $run(() => t_props_1["items"] = $props.items);
    const t_slots_1 = {};
    t_slots_1["_"] = ($sparent, $sanchor, $sprops) => {
      const t_fragment_2 = t_fragment(t_fragments, 2, `#`);
      const t_root_2 = t_root(t_fragment_2);
      const t_text_1 = t_root_2;
      $run(function setTextContent() {
        t_text_1.textContent = ` ${t_fmt($sprops.item.text)} `;
      });
      t_add_fragment(t_fragment_2, $sparent, $sanchor);
      t_next(t_text_1);
    }
    List.render(t_fragment_0, t_comp_anchor_1, t_props_1, t_slots_1, $context)
    t_add_fragment(t_fragment_0, $parent, $anchor);
  }
}

export default Let;
