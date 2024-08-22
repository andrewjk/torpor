const IsAvailable = {
  name: "IsAvailable",
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
      isAvailable: false
    });
    let $output = "";
    /* User interface */
    const t_fmt = (text) => text != null ? text : "";
    $output += `<div> <div>${t_fmt($state.isAvailable ? "Available" : "Not available")}</div> <input id="is-available" type="checkbox" checked="${$state.isAvailable || false}"/> <label for="is-available">Is available</label> </div>`;
    return $output;
  }
}

IsAvailable;
