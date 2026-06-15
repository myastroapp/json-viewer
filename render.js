// Lazy collapsible JSON tree. Children are built only when a node is first expanded,
// so huge documents mount instantly and grow only as the user explores them.

export function valueType(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v; // "object" | "string" | "number" | "boolean"
}

export function isContainer(v) {
  const t = valueType(v);
  return t === "object" || t === "array";
}

function entriesOf(v) {
  return valueType(v) === "array"
    ? v.map((val, i) => [i, val])
    : Object.keys(v).map((k) => [k, v[k]]);
}

export function countNodes(value, limit = Infinity) {
  let n = 0;
  const stack = [value];
  while (stack.length) {
    const v = stack.pop();
    n++;
    if (n > limit) return n;
    if (isContainer(v)) for (const [, c] of entriesOf(v)) stack.push(c);
  }
  return n;
}

export function createTree(value) {
  const root = document.createElement("div");
  root.className = "jv-tree";
  const node = makeNode(null, value, true);
  root.appendChild(node);
  if (isContainer(value)) expandNode(node); // auto-open the root one level
  return root;
}

function makeNode(key, value, isRoot) {
  const node = document.createElement("div");
  node.className = "jv-node";
  node._value = value;
  node._key = key;

  const row = document.createElement("div");
  row.className = "jv-row";

  const type = valueType(value);
  const container = isContainer(value);

  const toggle = document.createElement("span");
  toggle.className = "jv-toggle";
  toggle.dataset.expandable = container ? "1" : "0";
  toggle.textContent = container ? "▶" : "";
  row.appendChild(toggle);

  if (key !== null) {
    const keyEl = document.createElement("span");
    keyEl.className = "jv-key";
    keyEl.textContent = typeof key === "number" ? key : JSON.stringify(key);
    row.appendChild(keyEl);
    const colon = document.createElement("span");
    colon.className = "jv-colon";
    colon.textContent = ": ";
    row.appendChild(colon);
  }

  if (container) {
    const summary = document.createElement("span");
    summary.className = "jv-summary";
    const n = type === "array" ? value.length : Object.keys(value).length;
    summary.textContent = type === "array" ? `[ ${n} ]` : `{ ${n} }`;
    row.appendChild(summary);
    row.classList.add("jv-clickable");
    const onToggle = (e) => {
      e.stopPropagation();
      node.classList.contains("jv-open") ? collapseNode(node) : expandNode(node);
    };
    toggle.addEventListener("click", onToggle);
    row.addEventListener("click", onToggle);
  } else {
    const val = document.createElement("span");
    val.className = "jv-val jv-" + type;
    val.textContent = type === "string" ? JSON.stringify(value) : String(value);
    row.appendChild(val);
  }

  node.appendChild(row);
  const childrenWrap = document.createElement("div");
  childrenWrap.className = "jv-children";
  node.appendChild(childrenWrap);
  return node;
}

const CHUNK = 200; // render wide containers this many children at a time, so big files never hang

function buildChildren(node) {
  const wrap = node.querySelector(":scope > .jv-children");
  const existingMore = wrap.querySelector(":scope > .jv-more");
  if (existingMore) existingMore.remove();
  const entries = node._entries;
  const end = Math.min(node._cursor + CHUNK, entries.length);
  const frag = document.createDocumentFragment();
  for (let i = node._cursor; i < end; i++) {
    frag.appendChild(makeNode(entries[i][0], entries[i][1], false));
  }
  wrap.appendChild(frag);
  node._cursor = end;
  if (end < entries.length) {
    const remaining = entries.length - end;
    const more = document.createElement("div");
    more.className = "jv-more";
    more.textContent = `▾ show ${Math.min(CHUNK, remaining)} more (${remaining.toLocaleString()} remaining)`;
    more.addEventListener("click", (e) => { e.stopPropagation(); buildChildren(node); });
    wrap.appendChild(more);
  }
}

export function expandNode(node) {
  if (!isContainer(node._value)) return;
  if (!node._built) {
    node._entries = entriesOf(node._value);
    node._cursor = 0;
    buildChildren(node);
    node._built = true;
  }
  node.classList.add("jv-open");
  const toggle = node.querySelector(":scope > .jv-row > .jv-toggle");
  if (toggle) toggle.textContent = "▼";
}

export function collapseNode(node) {
  node.classList.remove("jv-open");
  const toggle = node.querySelector(":scope > .jv-row > .jv-toggle");
  if (toggle) toggle.textContent = "▶";
}

export function expandAll(treeRoot, maxNodes = 20000) {
  const root = treeRoot.querySelector(":scope > .jv-node");
  if (!root) return false;
  if (countNodes(root._value, maxNodes + 1) > maxNodes) return false; // too big; refuse
  const walk = (node) => {
    if (!isContainer(node._value)) return;
    expandNode(node);
    while (node._cursor < node._entries.length) buildChildren(node); // fully build (total bounded by maxNodes)
    for (const c of node.querySelector(":scope > .jv-children").children) {
      if (c.classList.contains("jv-node")) walk(c);
    }
  };
  walk(root);
  return true;
}

export function collapseAll(treeRoot) {
  for (const node of treeRoot.querySelectorAll(".jv-node.jv-open")) collapseNode(node);
  const root = treeRoot.querySelector(":scope > .jv-node");
  if (root && isContainer(root._value)) expandNode(root); // keep root open
}

// Search the parsed data (not the DOM) so matches inside un-rendered nodes are found too.
export function searchData(value, query, cap = 500) {
  const q = query.toLowerCase();
  const out = [];
  const walk = (val, path) => {
    if (out.length >= cap) return;
    if (isContainer(val)) {
      for (const [k, v] of entriesOf(val)) {
        if (out.length >= cap) return;
        const here = path.concat([k]);
        if (String(k).toLowerCase().includes(q)) out.push(here);
        walk(v, here);
      }
    } else {
      const s = (valueType(val) === "string" ? val : String(val)).toLowerCase();
      if (s.includes(q)) out.push(path);
    }
  };
  walk(value, []);
  return out;
}

// Build chunks of a node's children until one with the given key appears (or we run out).
function ensureChild(node, step) {
  if (!node._built) expandNode(node);
  const wrap = node.querySelector(":scope > .jv-children");
  const find = () => {
    for (const c of wrap.children) {
      if (c.classList.contains("jv-node") && c._key === step) return c;
    }
    return null;
  };
  let child = find();
  while (!child && node._cursor < node._entries.length) { buildChildren(node); child = find(); }
  return child;
}

export function expandPath(treeRoot, path) {
  let node = treeRoot.querySelector(":scope > .jv-node");
  if (!node) return null;
  if (isContainer(node._value)) expandNode(node);
  for (const step of path) {
    const child = ensureChild(node, step);
    if (!child) return null;
    if (isContainer(child._value)) expandNode(child);
    node = child;
  }
  return node;
}
