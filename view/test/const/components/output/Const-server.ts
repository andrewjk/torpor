const Const = {
  name: "Const",
  /**
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($props, $slots, $context) => {
    /* User interface */
    const t_fmt = (text) => text != null ? text : "";
    let $output = "";
    $output += `<div> `;
    const name = "Boris";
    $output += ` <p> Hello, ${t_fmt(name)}! </p> </div>`;
    return $output;
  }
}

Const;
