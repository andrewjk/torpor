const Increment = {
  name: "Increment",
  /**
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($props, $slots, $context) => {
    /* User script */
    const $watch = (obj) => obj;
    const $state = $watch({ counter: 0 })

    function increment(e, num) {
      $state.counter += num || 1;
    }
    /* User interface */
    const t_fmt = (text) => text != null ? text : "";
    let $output = "";
    $output += `<div> <button> Increment </button> <button> Increment </button> <p> The count is ${t_fmt($state.counter)}. </p> </div>`;
    return $output;
  }
}

Increment;
