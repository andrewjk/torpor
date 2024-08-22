const IfElseIf = {
  name: "IfElseIf",
  /**
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($props, $slots, $context) => {
    let $output = "";
    /* User interface */
    const t_fmt = (text) => text != null ? text : "";
    $output += `<div> <![>`;
    if ($props.counter > 10) {
      $output += `<!^> <p> It's over ten! </p> `;
    }
    else if ($props.counter > 5) {
      $output += `<!^> <p> It's over five! </p> `;
    }
    else {
      $output += `<!^> <p> It's not there yet </p> `;
    }
    $output += `<!]><!> </div>`;
    return $output;
  }
}

IfElseIf;
