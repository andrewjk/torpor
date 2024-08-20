const For = {
  name: "For",
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
    for (let item of $props.items) {
      $output += `<!^> <p>${t_fmt(item.text)}</p> `;
    }
    $output += `<!]><!> </div>`;
    return $output;
  }
}

For;
