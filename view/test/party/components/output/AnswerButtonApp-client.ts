import AnswerButton from './AnswerButton.tera';
import $watch from '../../../../../tera/view/src/watch/$watch';
import t_fragment from '../../../../../tera/view/src/render/internal/getFragment';
import t_root from '../../../../../tera/view/src/render/internal/nodeRoot';
import t_child from '../../../../../tera/view/src/render/internal/nodeChild';
import t_next from '../../../../../tera/view/src/render/internal/nodeNext';
import t_anchor from '../../../../../tera/view/src/render/internal/findAnchor';
import $run from '../../../../../tera/view/src/watch/$run';
import t_apply_props from '../../../../../tera/view/src/render/internal/applyProps';
import t_fmt from '../../../../../tera/view/src/render/internal/formatText';
import t_add_fragment from '../../../../../tera/view/src/render/internal/addFragment';

const AnswerButtonApp = {
  name: "AnswerButtonApp",
  /**
  * @param {Node} $parent
  * @param {Node | null} $anchor
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($parent, $anchor, $props, $slots, $context) => {
    /* User script */
    let $state = $watch({
      isHappy: true
    });

    function onAnswerNo() {
      $state.isHappy = false;
    }

    function onAnswerYes() {
      $state.isHappy = true;
    }
    
    /* User interface */
    const t_fragments = [];

    const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <p>Are you happy?</p> <!> <p style="font-size: 50px;">#</p> </div>`);
    const t_div_1 = t_root(t_fragment_0);
    const t_comp_anchor_1 = t_anchor(t_next(t_next(t_next(t_child(t_div_1)))));

    /* @component */
    const t_props_1 = $watch({});
    $run(function setProp() {
      t_props_1["onYes"] = onAnswerYes;
    });
    $run(function setProp() {
      t_props_1["onNo"] = onAnswerNo;
    });
    AnswerButton.render(t_div_1, t_comp_anchor_1, t_props_1, undefined, $context)
    const t_text_1 = t_child(t_next(t_next(t_comp_anchor_1)));

    t_apply_props(t_div_1, $props, []);
    $run(function setTextContent() {
      t_text_1.textContent = t_fmt($state.isHappy ? "😀" : "😥");
    });
    t_add_fragment(t_fragment_0, $parent, $anchor);
    t_next(t_div_1);
  }
}

export default AnswerButtonApp;
