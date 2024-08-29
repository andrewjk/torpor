const Element = {
  name: "Element",
  /**
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($props, $slots, $context) => {
    let $output = "";
    /* User interface */
    const t_fmt = (text) => text != null ? text : "";
    $output += `<${$props.tag}> Hello! </${$props.tag}>`;
    return $output;
  }
}

Element;
