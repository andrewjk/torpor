const ArrayIndexes = {
  name: "ArrayIndexes",
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
    for (let i = 0; i < $props.items.length; i++) {
      $output += `<!^>  <span> ${t_fmt(i > 0 ? ", " : "")} ${t_fmt($props.items[i].text)} </span> `;
    }
    $output += `<!]><!> <p>$</p> </section>`;
    return $output;
  }
}

ArrayIndexes;
