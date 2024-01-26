import watchEffect from '../../watch/src/watchEffect';
import clearRange from '../../view/src/render/clearRange';
import reconcileList from '../../view/src/render/reconcileList';
import watch from "../../watch/src/watch";

const Demo = {
name: "Demo",
render: (parent: Node, anchor: Node | null) => {
// TODO: Test with async
    let number = 0;
    function sleep(ms: number) {
      number++;
      return new Promise((ok: any, err: any) => {
        return setTimeout(number % 3 === 0 ? () => err("uh oh") : () => ok("ok"), ms);
      });
    }

    const state = watch({
        condition: false,
        count: 0,
        letters: ["a", "b", "c", "d", "e", "f", "g"],
        deep: {
            text: "",
            class: ""
        },
        sleeper: sleep(1000),
    });

    function increment() {
        state.count += 1;
        console.log(state.count);
    }

    function nextLetter() {
        return Array.from("abcdefghijklmnopqrstuvwxyz").filter(f => !state.letters.includes(f))[0];
    }

const div1 = document.createElement("div");
const p1 = document.createElement("p");
const text1 = document.createTextNode("The count is ");
p1.insertBefore(text1, null);
const strong1 = document.createElement("strong");
const text2 = document.createTextNode("");
strong1.insertBefore(text2, null);
watchEffect(() => text2.textContent = `${state.count}`);
p1.insertBefore(strong1, null);
const text3 = document.createTextNode("");
p1.insertBefore(text3, null);
watchEffect(() => text3.textContent = `. It is ${state.count % 2 == 0 ? "even" : "odd"}.`);
div1.insertBefore(p1, null);
const text4 = document.createTextNode(" ");
div1.insertBefore(text4, null);
const x = 5;const text5 = document.createTextNode(" ");
div1.insertBefore(text5, null);
const button1 = document.createElement("button");
button1.addEventListener("click", increment);
const text6 = document.createTextNode("Increment");
button1.insertBefore(text6, null);
div1.insertBefore(button1, null);
const text7 = document.createTextNode(" ");
div1.insertBefore(text7, null);
const button2 = document.createElement("button");
button2.addEventListener("click", () => state.count = 0);
const text8 = document.createTextNode("Reset");
button2.insertBefore(text8, null);
div1.insertBefore(button2, null);
const text9 = document.createTextNode(" ");
div1.insertBefore(text9, null);

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
const text10 = document.createTextNode("Zero");
p2.insertBefore(text10, null);
div1.insertBefore(p2, logicAnchor1.nextSibling);

logicEndNode1 = p2;
logicIndex1 = 0;
break;
}
case 1: {
if (logicIndex1 === 1) return;
if (logicEndNode1) clearRange(logicAnchor1, logicEndNode1);

const p3 = document.createElement("p");
const text11 = document.createTextNode("One");
p3.insertBefore(text11, null);
div1.insertBefore(p3, logicAnchor1.nextSibling);

logicEndNode1 = p3;
logicIndex1 = 1;
break;
}
case 2: {
if (logicIndex1 === 2) return;
if (logicEndNode1) clearRange(logicAnchor1, logicEndNode1);

const p4 = document.createElement("p");
const text12 = document.createTextNode("Two");
p4.insertBefore(text12, null);
div1.insertBefore(p4, logicAnchor1.nextSibling);

logicEndNode1 = p4;
logicIndex1 = 2;
break;
}
case 3: {
if (logicIndex1 === 3) return;
if (logicEndNode1) clearRange(logicAnchor1, logicEndNode1);

const p5 = document.createElement("p");
const text13 = document.createTextNode("Three");
p5.insertBefore(text13, null);
div1.insertBefore(p5, logicAnchor1.nextSibling);

logicEndNode1 = p5;
logicIndex1 = 3;
break;
}
default: {
if (logicIndex1 === 4) return;
if (logicEndNode1) clearRange(logicAnchor1, logicEndNode1);

const p6 = document.createElement("p");
const text14 = document.createTextNode("More");
p6.insertBefore(text14, null);
div1.insertBefore(p6, logicAnchor1.nextSibling);

logicEndNode1 = p6;
logicIndex1 = 4;
break;
}
}
});

const text15 = document.createTextNode(" ");
div1.insertBefore(text15, null);

const logicAnchor2 = document.createComment("@if");
div1.insertBefore(logicAnchor2, null);

let logicEndNode2: ChildNode | undefined;
let logicIndex2 = -1;
watchEffect(() => {
if (state.count > 5 && state.count <= 10) {
if (logicIndex2 === 0) return;
if (logicEndNode2) clearRange(logicAnchor2, logicEndNode2);

const p7 = document.createElement("p");
const text16 = document.createTextNode("Whoa there!");
p7.insertBefore(text16, null);
div1.insertBefore(p7, logicAnchor2.nextSibling);

logicEndNode2 = p7;
logicIndex2 = 0;
}
else if (state.count > 10) {
if (logicIndex2 === 1) return;
if (logicEndNode2) clearRange(logicAnchor2, logicEndNode2);

const p8 = document.createElement("p");
const text17 = document.createTextNode("I said whoa there!!");
p8.insertBefore(text17, null);
div1.insertBefore(p8, logicAnchor2.nextSibling);
const text18 = document.createTextNode(" ");
div1.insertBefore(text18, p8.nextSibling);
const p9 = document.createElement("p");
const text19 = document.createTextNode("BUDDY");
p9.insertBefore(text19, null);
div1.insertBefore(p9, text18.nextSibling);

logicEndNode2 = p9;
logicIndex2 = 1;
}
else {
if (logicIndex2 === 2) return;
if (logicEndNode2) clearRange(logicAnchor2, logicEndNode2);


logicEndNode2 = undefined;
logicIndex2 = 2;
}
});

const text20 = document.createTextNode(" ");
div1.insertBefore(text20, null);
const p10 = document.createElement("p");

const logicAnchor3 = document.createComment("@for");
p10.insertBefore(logicAnchor3, null);

let forItems1: any[] = [];
watchEffect(() => {
let newForItems: any[] = [];
for (let i = 0; i < state.letters.length; i++) {
let item: any = {};
item["key"] = state.letters[i];;
item.data = {};
item.data["i"] = i;
newForItems.push(item);
}

reconcileList(
p10,
forItems1,
newForItems,
logicAnchor3.nextSibling,
(parent: Node, item: any, before: Node | null) => {
let { i } = item.data;
item.anchor = document.createComment("@for item " + item.key);
parent.insertBefore(item.anchor, before);


const text21 = document.createTextNode(" ");
parent.insertBefore(text21, before);
const span1 = document.createElement("span");
const text22 = document.createTextNode("");
span1.insertBefore(text22, null);
watchEffect(() => text22.textContent = `${i > 0 ? ", " : ""}${state.letters[i]}`);
parent.insertBefore(span1, before);

item.endNode = span1;
},
);

forItems1 = newForItems;
});

div1.insertBefore(p10, null);
const text23 = document.createTextNode(" ");
div1.insertBefore(text23, null);
const button3 = document.createElement("button");
button3.addEventListener("click", () => {
      state.letters = state.letters
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
    });
const text24 = document.createTextNode("Shuffle letters");
button3.insertBefore(text24, null);
div1.insertBefore(button3, null);
const text25 = document.createTextNode(" ");
div1.insertBefore(text25, null);
const button4 = document.createElement("button");
button4.addEventListener("click", () => {
      // HACK: should be able to push
      state.letters = [...state.letters, nextLetter()]
    });
const text26 = document.createTextNode("Add a letter");
button4.insertBefore(text26, null);
div1.insertBefore(button4, null);
const text27 = document.createTextNode(" ");
div1.insertBefore(text27, null);
const button5 = document.createElement("button");
button5.addEventListener("click", () => {
      // HACK: should be able to update
      state.letters = [...state.letters.slice(0, 3), nextLetter(), ...state.letters.slice(4)];
    });
const text28 = document.createTextNode("Change a letter");
button5.insertBefore(text28, null);
div1.insertBefore(button5, null);
const text29 = document.createTextNode(" ");
div1.insertBefore(text29, null);
const button6 = document.createElement("button");
button6.addEventListener("click", () => {
      // HACK: should be able to update
      state.letters = [...state.letters.slice(0, 5), nextLetter(), ...state.letters.slice(5)];
    });
const text30 = document.createTextNode("Insert a letter");
button6.insertBefore(text30, null);
div1.insertBefore(button6, null);
const text31 = document.createTextNode(" ");
div1.insertBefore(text31, null);
const button7 = document.createElement("button");
button7.addEventListener("click", () => {
      // HACK: should be able to update
      state.letters = state.letters.map((l, i) => state.letters[state.letters.length - 1 - i]);
    });
const text32 = document.createTextNode("Reverse letters");
button7.insertBefore(text32, null);
div1.insertBefore(button7, null);
const text33 = document.createTextNode(" ");
div1.insertBefore(text33, null);
const p11 = document.createElement("p");
const text34 = document.createTextNode("");
p11.insertBefore(text34, null);
watchEffect(() => text34.textContent = `x is ${x}`);
div1.insertBefore(p11, null);
const text35 = document.createTextNode(" ");
div1.insertBefore(text35, null);

const logicAnchor4 = document.createComment("@await");
div1.insertBefore(logicAnchor4, null);

let logicEndNode3: ChildNode | undefined;
let awaitToken1 = 0;
watchEffect(() => {
awaitToken1++;

if (logicEndNode3) clearRange(logicAnchor4, logicEndNode3);

const p12 = document.createElement("p");
const text36 = document.createTextNode("Loading...");
p12.insertBefore(text36, null);
div1.insertBefore(p12, logicAnchor4.nextSibling);

logicEndNode3 = p12;

((token: number) => {
state.sleeper
.then((result) => {
if (token === awaitToken1) {
if (logicEndNode3) clearRange(logicAnchor4, logicEndNode3);

const p13 = document.createElement("p");
const text37 = document.createTextNode("");
p13.insertBefore(text37, null);
watchEffect(() => text37.textContent = `Loaded: ${result}!`);
div1.insertBefore(p13, logicAnchor4.nextSibling);

logicEndNode3 = p13;
}
})
.catch((ex) => {
if (token === awaitToken1) {
if (logicEndNode3) clearRange(logicAnchor4, logicEndNode3);

const p14 = document.createElement("p");
const text38 = document.createTextNode("");
p14.insertBefore(text38, null);
watchEffect(() => text38.textContent = `Something went wrong: ${ex}`);
div1.insertBefore(p14, logicAnchor4.nextSibling);

logicEndNode3 = p14;
}
});
})(awaitToken1);
});

const text39 = document.createTextNode(" ");
div1.insertBefore(text39, null);
const button8 = document.createElement("button");
button8.addEventListener("click", () => {
      console.log("resetting");
      state.sleeper = sleep(500);
    });
const text40 = document.createTextNode("Reset timer");
button8.insertBefore(text40, null);
div1.insertBefore(button8, null);
parent.insertBefore(div1, anchor && anchor.nextSibling);

}
};

export default Demo;