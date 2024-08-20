import type ControlNode from "../../types/nodes/ControlNode";
import { trimAny, trimMatched } from "../utils";
import type BuildStatus from "./BuildStatus";
import Builder from "./Builder";
import addFragment from "./buildAddFragment";
import declareFragment from "./buildDeclareFragment";
import buildNode from "./buildNode";
import { nextVarName } from "./buildUtils";

const forLoopRegex = /for\s*\((.+?);.*?;.*?\)/;
const forLoopVarsRegex = /(?:let\s+|var\s+){0,1}([^\s,;+=]+)(?:\s*=\s*[^,;]+){0,1}/g;
const forOfRegex = /for\s*\(\s*(?:let\s*|var\s*){0,1}(.+?)\s+(?:of|in).*?\)/;

export default function buildForNode(
  node: ControlNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  const forParentName = node.parentName!;
  const forAnchorName = node.varName!;

  // HACK:
  node = node.children[0] as ControlNode;

  // HACK: Need to wrangle the declaration(s) out of the for loop and put them in data
  // TODO: Handle destructuring, quotes, comments etc
  const forVarNames: string[] = [];
  const forIndexMatch = node.statement.match(forLoopRegex);
  if (forIndexMatch) {
    const forVarMatches = forIndexMatch[1].matchAll(forLoopVarsRegex);
    for (let match of forVarMatches) {
      forVarNames.push(match[1]);
    }
  } else {
    const forOfMatch = node.statement.match(forOfRegex);
    if (forOfMatch) {
      const match = forOfMatch[1];
      if (
        (match.startsWith("{") && match.endsWith("}")) ||
        (match.startsWith("[") && match.endsWith("]"))
      ) {
        forVarNames.push(
          ...trimMatched(trimMatched(match, "{", "}"), "[", "]")
            .split(",")
            .map((m) => m.trim()),
        );
      } else {
        forVarNames.push(match);
      }
    }
  }

  const oldRangeName = nextVarName("old_range", status);
  const oldItemRangeName = nextVarName("old_range", status);
  const forRangeName = nextVarName("for_range", status);
  const forItemsName = nextVarName("for_items", status);

  // Get the key node if it's been set
  const key = node.children.find(
    (n) => n.type === "control" && (n as ControlNode).operation === "@key",
  );
  const keyStatement = key ? (key as ControlNode).statement : "";

  b.append("");
  b.append(`
      /* @for */
      let ${forRangeName} = {};
      t_run_list(
        ${forRangeName},
        ${forParentName},
        ${forAnchorName},
        function createNewItems() {
          let t_new_items = [];
          ${node.statement} {
            t_new_items.push({
              ${keyStatement ? `key: ${trimAny(keyStatement.substring(keyStatement.indexOf("=") + 1).trim(), ";")},` : ";"}
              data: { ${forVarNames.join(",\n")} }
            });
          }
          return t_new_items;
        },
        function createListItem(t_item, t_before) {`);

  status.forVarNames = forVarNames;
  buildForItem(node, status, b, forParentName);
  status.forVarNames = [];

  b.append(`}`);
  b.append(`);`);
  b.append("");

  return;

  b.append("");
  b.append(`
      /* @for */
      let ${forRangeName} = {};
      let ${forItemsName} = [];
      let ${oldRangeName} = t_push_range_to_parent(${forRangeName});
      $run(function runFor() {
        let ${oldItemRangeName} = t_push_range(${forRangeName});
        let t_new_items = [];
        ${node.statement} {
          t_new_items.push({
            ${keyStatement ? `key: ${trimAny(keyStatement.substring(keyStatement.indexOf("=") + 1).trim(), ";")},` : ";"}
            data: { ${forVarNames.join(",\n")} }
          });
        }
        t_run_items(
          ${forParentName},
          ${forAnchorName},
          ${forItemsName},
          t_new_items,
          function createForItem(t_parent, t_item, t_before) {`);

  status.forVarNames = forVarNames;
  buildForItem(node, status, b, "t_parent");
  status.forVarNames = [];

  b.append(`}
        );
        ${forItemsName} = t_new_items;
        t_pop_range(${oldItemRangeName});
      });
      t_pop_range(${oldRangeName});`);
  b.append("");
}

function buildForItem(node: ControlNode, status: BuildStatus, b: Builder, parentName: string) {
  const oldRangeName = nextVarName("old_range", status);

  b.append(`let ${oldRangeName} = t_push_range_to_parent(t_item);`);

  declareFragment(node, status, b);

  status.fragmentStack.push({
    fragment: node.fragment!,
    path: "",
  });
  for (let child of node.children) {
    if (child.type === "control" && (child as ControlNode).operation === "@key") {
      continue;
    }
    buildNode(child, status, b, parentName, "t_before");
  }
  status.fragmentStack.pop();

  addFragment(node, status, b, parentName, "t_before");

  // If we wanted to return the fragment instead:
  //b.append(`t_item.startNode = t_fragment_1.firstChild;`);
  //b.append(`t_item.endNode = t_fragment_1.lastChild;`);
  //for (let ev of node.fragment!.events) {
  //  b.append(`${ev.varName}.addEventListener("${ev.eventName}", ${ev.handler});`);
  //}

  b.append(`t_pop_range(${oldRangeName});`);

  // If we wanted to return the fragment instead:
  //b.append(`return t_fragment_${node.fragment!.number};`);
}
