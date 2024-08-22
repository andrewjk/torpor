const ForOf = {
  name: "ForOf",
  /**
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($props, $slots, $context) => {
    let $output = "";
    /* User interface */
    const t_fmt = (text) => text != null ? text : "";
    $output += `<section> <![>`;
    for (let item of $props.items) {
      $output += `<!^> <p> ${t_fmt(item)} </p> `;
    }
    $output += `<!]><!> </section>`;
    return $output;
  }
}

ForOf;
