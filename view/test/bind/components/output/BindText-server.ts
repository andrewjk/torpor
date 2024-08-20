const BindText = {
  name: "BindText",
  /**
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($props, $slots, $context) => {
    /* User script */
    const $watch = (obj) => obj;
    let $state = $watch({ name: "Alice" });
    /* User interface */
    const t_fmt = (text) => text != null ? text : "";
    let $output = "";
    $output += `<div> <input value="${$state.name || ""}"/> <p>Hello, ${t_fmt($state.name)}</p> </div>`;
    return $output;
  }
}

BindText;
