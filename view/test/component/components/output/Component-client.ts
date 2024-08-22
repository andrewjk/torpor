import Header from './Header.tera';
import t_fragment from '../../../../../tera/view/src/render/internal/getFragment';
import t_root from '../../../../../tera/view/src/render/internal/nodeRoot';
import t_anchor from '../../../../../tera/view/src/render/internal/findAnchor';
import $watch from '../../../../../tera/view/src/watch/$watch';
import t_add_fragment from '../../../../../tera/view/src/render/internal/addFragment';

const Component = {
  name: "Component",
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
    t_props_1["name"] = "Amy";
    Header.render(t_fragment_0, t_comp_anchor_1, t_props_1, undefined, $context)
    t_add_fragment(t_fragment_0, $parent, $anchor);
  }
}

export default Component;
