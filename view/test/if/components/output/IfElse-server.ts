const IfElse = {
  name: "IfElse",
  /**
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($props, $slots, $context) => {
    /* User interface */
    const t_fmt = (text) => text != null ? text : "";
    let $output = "";
    $output += `<div> <![>`;
    if ($props.counter > 7) {
      $output += `<!^> <p> It's true! </p> `;
    }
    else {
      $output += `<!^> <p> It's not true... </p> `;
    }
    $output += `<!]><!> </div>`;
    return $output;
  }
}

IfElse;
