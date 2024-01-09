import clearRange from "../../view/src/render/clearRange";
import watch from "../../watch/src/watch";
import watchEffect from "../../watch/src/watchEffect";

const Demo = {
  name: "Demo",
  render: (parent: Node, anchor: Node | null) => {
    const state = watch({
      condition: false,
      count: 0,
      letters: [],
      deep: {
        text: "",
        class: "",
      },
    });

    function increment() {
      state.count += 1;
      console.log(state.count);
    }

    const div1 = document.createElement("div");
    const p1 = document.createElement("p");
    const text1 = document.createTextNode("The count is ");
    p1.insertBefore(text1, null);
    const strong1 = document.createElement("strong");
    const text2 = document.createTextNode("");
    strong1.insertBefore(text2, null);
    watchEffect(() => (text2.textContent = `${state.count}`));
    p1.insertBefore(strong1, null);
    const text3 = document.createTextNode("");
    p1.insertBefore(text3, null);
    watchEffect(() => (text3.textContent = `. It is ${state.count % 2 == 0 ? "even" : "odd"}.`));
    div1.insertBefore(p1, null);
    const text4 = document.createTextNode(" ");
    div1.insertBefore(text4, null);
    const button1 = document.createElement("button");
    button1.addEventListener("click", increment);
    const text5 = document.createTextNode("Increment");
    button1.insertBefore(text5, null);
    div1.insertBefore(button1, null);
    const text6 = document.createTextNode(" ");
    div1.insertBefore(text6, null);
    const button2 = document.createElement("button");
    button2.addEventListener("click", () => (state.count = 0));
    const text7 = document.createTextNode("Reset");
    button2.insertBefore(text7, null);
    div1.insertBefore(button2, null);
    const text8 = document.createTextNode(" ");
    div1.insertBefore(text8, null);

    const logicAnchor1 = document.createComment("@switch");
    div1.insertBefore(logicAnchor1, null);

    let logicEndNode1: ChildNode | undefined;
    let logicIndex1 = -1;
    watchEffect(() => {
      switch (state.count) {
        case 0: {
          if (logicIndex1 === 0) return;
          if (logicEndNode1) clearRange(logicAnchor1, logicEndNode1);

          const p2 = document.createElement("p");
          const text9 = document.createTextNode("Zero");
          p2.insertBefore(text9, null);
          div1.insertBefore(p2, logicAnchor1.nextSibling);

          logicEndNode1 = p2;
          logicIndex1 = 0;
          break;
        }
        case 1: {
          if (logicIndex1 === 1) return;
          if (logicEndNode1) clearRange(logicAnchor1, logicEndNode1);

          const p3 = document.createElement("p");
          const text10 = document.createTextNode("One");
          p3.insertBefore(text10, null);
          div1.insertBefore(p3, logicAnchor1.nextSibling);

          logicEndNode1 = p3;
          logicIndex1 = 1;
          break;
        }
        case 2: {
          if (logicIndex1 === 2) return;
          if (logicEndNode1) clearRange(logicAnchor1, logicEndNode1);

          const p4 = document.createElement("p");
          const text11 = document.createTextNode("Two");
          p4.insertBefore(text11, null);
          div1.insertBefore(p4, logicAnchor1.nextSibling);

          logicEndNode1 = p4;
          logicIndex1 = 2;
          break;
        }
        case 3: {
          if (logicIndex1 === 3) return;
          if (logicEndNode1) clearRange(logicAnchor1, logicEndNode1);

          const p5 = document.createElement("p");
          const text12 = document.createTextNode("Three");
          p5.insertBefore(text12, null);
          div1.insertBefore(p5, logicAnchor1.nextSibling);

          logicEndNode1 = p5;
          logicIndex1 = 3;
          break;
        }
        default: {
          if (logicIndex1 === 4) return;
          if (logicEndNode1) clearRange(logicAnchor1, logicEndNode1);

          const p6 = document.createElement("p");
          const text13 = document.createTextNode("More");
          p6.insertBefore(text13, null);
          div1.insertBefore(p6, logicAnchor1.nextSibling);

          logicEndNode1 = p6;
          logicIndex1 = 4;
          break;
        }
      }
    });

    const text14 = document.createTextNode(" ");
    div1.insertBefore(text14, null);

    const logicAnchor2 = document.createComment("@if");
    div1.insertBefore(logicAnchor2, null);

    let logicEndNode2: ChildNode | undefined;
    let logicIndex2 = -1;
    watchEffect(() => {
      if (state.count > 5 && state.count <= 10) {
        if (logicIndex2 === 0) return;
        if (logicEndNode2) clearRange(logicAnchor2, logicEndNode2);

        const p7 = document.createElement("p");
        const text15 = document.createTextNode("Whoa there!");
        p7.insertBefore(text15, null);
        div1.insertBefore(p7, logicAnchor2.nextSibling);

        logicEndNode2 = p7;
        logicIndex2 = 0;
      } else if (state.count > 10) {
        if (logicIndex2 === 1) return;
        if (logicEndNode2) clearRange(logicAnchor2, logicEndNode2);

        const p8 = document.createElement("p");
        const text16 = document.createTextNode("I said whoa there!!");
        p8.insertBefore(text16, null);
        div1.insertBefore(p8, logicAnchor2.nextSibling);
        const text17 = document.createTextNode(" ");
        div1.insertBefore(text17, p8.nextSibling);
        const p9 = document.createElement("p");
        const text18 = document.createTextNode("BUDDY");
        p9.insertBefore(text18, null);
        div1.insertBefore(p9, text17.nextSibling);

        logicEndNode2 = p9;
        logicIndex2 = 1;
      } else {
        if (logicIndex2 === 2) return;
        if (logicEndNode2) clearRange(logicAnchor2, logicEndNode2);

        logicEndNode2 = undefined;
        logicIndex2 = 2;
      }
    });

    const text19 = document.createTextNode(" ");
    div1.insertBefore(text19, null);
    parent.insertBefore(div1, anchor && anchor.nextSibling);
  },
};

export default Demo;
