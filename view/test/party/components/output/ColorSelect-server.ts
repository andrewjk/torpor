const ColorSelect = {
  name: "ColorSelect",
  /**
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($props, $slots, $context) => {
    /* User script */
    const $watch = (obj) => obj;
    let $state = $watch({
      selectedColorId: 2
    });

    const colors = [
      { id: 1, text: "red" },
      { id: 2, text: "blue" },
      { id: 3, text: "green" },
      { id: 4, text: "gray", isDisabled: true },
    ];
    let $output = "";
    /* User interface */
    const t_fmt = (text) => text != null ? text : "";
    $output += `<div> <div>Selected: ${t_fmt(colors[$state.selectedColorId - 1].text)}</div> <select value="${$state.selectedColorId || ""}"> <![>`;
    for (let color of colors) {
      $output += `<!^> <option ${color.id ? `value="${color.id}"` : ''} ${color.isDisabled ? `disabled="${color.isDisabled}"` : ''}> ${t_fmt(color.text)} </option> `;
    }
    $output += `<!]><!> </select> </div>`;
    return $output;
  }
}

ColorSelect;
