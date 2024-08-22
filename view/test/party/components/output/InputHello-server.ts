const InputHello = {
  name: "InputHello",
  /**
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($props, $slots, $context) => {
    /* User script */
    const $watch = (obj) => obj;
    const $run = (fn) => null;
    let $state = $watch({
      text: "Hello World"
    });
    let $output = "";
    /* User interface */
    const t_fmt = (text) => text != null ? text : "";
    $output += `<div> <p>${t_fmt($state.text)}</p> <input value="${$state.text || ""}"/></div>`;
    return $output;
  }
}

InputHello;
