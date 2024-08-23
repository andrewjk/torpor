const AnswerButtonApp = {
  name: "AnswerButtonApp",
  /**
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($props, $slots, $context) => {
    /* User script */
    const $watch = (obj) => obj;
    let $state = $watch({
      isHappy: true
    });

    function onAnswerNo() {
      $state.isHappy = false;
    }

    function onAnswerYes() {
      $state.isHappy = true;
    }
    let $output = "";
    /* User interface */
    const t_fmt = (text) => text != null ? text : "";
    $output += `<div> <p>Are you happy?</p> `;
    const t_props_1 = {};
    t_props_1["onYes"] = onAnswerYes;
    t_props_1["onNo"] = onAnswerNo;
    $output += AnswerButton.render(t_props_1, undefined, $context)
    $output += ` <p style="font-size: 50px;">${t_fmt($state.isHappy ? "😀" : "😥")}</p> </div>`;
    return $output;
  }
}

AnswerButtonApp;
