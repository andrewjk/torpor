const Array = {
  name: "Array",
  /**
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($props, $slots, $context) => {
    /* User interface */
    const t_fmt = (text) => text != null ? text : "";
    let $output = "";
    $output += `<section> <p>^</p> <![>`;
    for (let item of $props.items) {
      $output += `<!^>  <p> ${t_fmt(item.text)} </p> `;
    }
    $output += `<!]><!> <p>$</p> </section>`;
    return $output;
  }
}

Array;
