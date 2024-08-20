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
const ArrayEntries = {
  name: "ArrayEntries",
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

    const t_fragment_0 = t_fragment(t_fragments, 0, `<section> <p>^</p> <!> <p>$</p> </section>`);
    const t_root_0 = t_root(t_fragment_0);
    const t_section_1 = t_root_0;
    const t_for_anchor_1 = t_anchor(t_next(t_next(t_next(t_child(t_section_1)))));

    /* @for */
    let t_for_range_1 = {};
    t_run_list(
      t_for_range_1,
      t_root_0,
      t_for_anchor_1,
      function createNewItems() {
        let t_new_items = [];
        for (let [i, item] of $props.items.entries()) {
          t_new_items.push({
            key: item.id,
            data: { i,
            item }
          });
        }
        return t_new_items;
      },
      function createListItem(t_item, t_before) {
        let t_old_range_1 = t_push_range_to_parent(t_item);
        const t_fragment_1 = t_fragment(t_fragments, 1, ` <span>#</span> `);
        const t_root_1 = t_root(t_fragment_1);
        const t_text_1 = t_child(t_next(t_root_1));
        const t_text_2 = t_next(t_next(t_root_1));
        $run(function setTextContent() {
          let i = t_item.data.i; 
          let item = t_item.data.item; 
          t_text_1.textContent = ` ${t_fmt(i > 0 ? ", " : "")} ${t_fmt(item.text)} `;
        });
        t_add_fragment(t_fragment_1, t_root_0, t_before);
        t_next(t_text_2);
        t_pop_range(t_old_range_1);
      }
    );


    t_apply_props(t_section_1, $props, ['items']);
    t_add_fragment(t_fragment_0, $parent, $anchor);
    t_next(t_section_1);
  }
}

export default ArrayEntries;
