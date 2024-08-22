const Colors = {
  name: "Colors",
  /**
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($props, $slots, $context) => {
    /* User script */
    const $watch = (obj) => obj;
    const $run = (fn) => null;
    const colors = ["red", "green", "blue"];
    let $output = "";
    /* User interface */
    const t_fmt = (text) => text != null ? text : "";
    $output += `<ul> <![>`;
    for (let color of colors) {
      $output += `<!^>  <li>${t_fmt(color)}</li> `;
    }
    $output += `<!]><!> </ul>`;
    return $output;
  }
}

Colors;
