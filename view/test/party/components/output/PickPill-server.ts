const PickPill = {
  name: "PickPill",
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
      picked: "red"
    });
    let $output = "";
    /* User interface */
    const t_fmt = (text) => text != null ? text : "";
    $output += `<div> <div>Picked: ${t_fmt($state.picked)}</div> <input id="blue-pill" group="${$state.picked || ""}" type="radio" value="blue"/> <label for="blue-pill">Blue pill</label> <input id="red-pill" group="${$state.picked || ""}" type="radio" value="red"/> <label for="red-pill">Red pill</label> </div>`;
    return $output;
  }
}

PickPill;
