const NestedIf = {
  name: "NestedIf",
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
    if ($props.condition) {
      $output += `<!^> <![>`;
      if ($props.counter > 5) {
        $output += `<!^> <p>It's big</p> `;
      }
      else {
        $output += `<!^> <p>It's small</p> `;
      }
      $output += `<!]><!> `;
    }
    $output += `<!]><!> </div>`;
    return $output;
  }
}

NestedIf;
