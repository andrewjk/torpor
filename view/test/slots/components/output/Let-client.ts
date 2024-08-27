import List from './List.tera';
import t_fragment from '../../../../../tera/view/src/render/internal/getFragment';
import t_root from '../../../../../tera/view/src/render/internal/nodeRoot';
import t_anchor from '../../../../../tera/view/src/render/internal/findAnchor';
import $watch from '../../../../../tera/view/src/watch/$watch';
import $run from '../../../../../tera/view/src/watch/$run';
import t_fmt from '../../../../../tera/view/src/render/internal/formatText';
import t_add_fragment from '../../../../../tera/view/src/render/internal/addFragment';
import t_next from '../../../../../tera/view/src/render/internal/nodeNext';

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
    $props = Object.assign({}, $props);

    /* User interface */
    const t_fragments = [];

    const t_fragment_0 = t_fragment(t_fragments, 0, `<!>`);
    const t_root_0 = t_root(t_fragment_0);
    const t_comp_anchor_1 = t_anchor(t_root_0);

    /* @component */
    const t_props_1 = $watch({});
    $run(function setProp() {
      t_props_1["items"] = $props.items;
    });
    const t_slots_1 = {};
    t_slots_1["_"] = ($sparent, $sanchor, $sprops) => {
      const t_fragment_2 = t_fragment(t_fragments, 2, `#`);
      const t_text_1 = t_root(t_fragment_2);
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
