const DoubleCount = {
  name: "DoubleCount",
  /**
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($props, $slots, $context) => {
    /* User script */
    const $watch = (obj) => obj;
    let $state = $watch({
      count: 10,
      get doubleCount() {
        return this.count * 2;
      }
    });
    let $output = "";
    /* User interface */
    const t_fmt = (text) => text != null ? text : "";
    $output += `<div>${t_fmt($state.doubleCount)}</div>`;
    return $output;
  }
}

DoubleCount;
