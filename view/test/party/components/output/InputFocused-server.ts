const InputFocused = {
  name: "InputFocused",
  /**
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($props, $slots, $context) => {
    /* User script */
    const $watch = (obj) => obj;
    const $run = (fn) => null;
    let inputElement;

    $run(() => {
      inputElement.focus();
    });
    let $output = "";
    /* User interface */
    const t_fmt = (text) => text != null ? text : "";
    $output += `<input this="${inputElement || ""}"/>`;
    return $output;
  }
}

InputFocused;
