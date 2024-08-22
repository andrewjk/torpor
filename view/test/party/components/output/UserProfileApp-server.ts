const UserProfileApp = {
  name: "UserProfileApp",
  /**
  * @param {Object} [$props]
  * @param {Object} [$slots]
  * @param {Object} [$context]
  */
  render: ($props, $slots, $context) => {
    let $output = "";
    /* User interface */
    const t_fmt = (text) => text != null ? text : "";
    const t_props_1 = {};
    t_props_1["name"] = "John";
    t_props_1["age"] = 20;
    t_props_1["favouriteColors"] = ["green", "blue", "red"];
    t_props_1["isAvailable"] = true;
    $output += UserProfile.render(t_props_1, undefined, $context)
    return $output;
  }
}

UserProfileApp;
