const Unused = {
  name: "Unused",
  /**
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($props, $slots, $context) => {
    let $output = "";
    /* User interface */
    const t_fmt = (text) => text != null ? text : "";
    $output += Header.render(undefined, undefined, $context)
    return $output;
  }
}

Unused;
