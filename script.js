const $ = (id) => document.getElementById(id);

/* ---------------- Navigation ---------------- */
function showPage(name) {
  document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.id === name));
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.page === name));
  window.scrollTo({ top: 0, behavior: "smooth" });
}
// Every button/link with a data-page attribute (navbar + Home cards) switches pages when clicked.
document.querySelectorAll("[data-page]").forEach((el) =>
  el.addEventListener("click", (e) => {
    e.preventDefault();
    showPage(el.dataset.page);
  })
);

/* ---------------- Helpers ---------------- */
function parseList(str) {
  const parts = str.split(",").map((s) => s.trim()).filter((s) => s !== "");
  const nums = parts.map(Number);
  if (nums.some((n) => Number.isNaN(n))) return null;
  return nums;
}

const fmtSet = (arr) => (arr.length ? "{ " + arr.join(", ") + " }" : "∅");
const uniqSorted = (arr) => [...new Set(arr)].sort((a, b) => a - b);

/* =========================================================
   SETS
   ========================================================= */
function layoutItems(items, cx, cy, perRow) {
  if (!items.length) return "";
  const rows = Math.ceil(items.length / perRow);
  const lineH = 26;
  const startY = cy - ((rows - 1) * lineH) / 2;
  let out = "";
  for (let r = 0; r < rows; r++) {
    const rowItems = items.slice(r * perRow, (r + 1) * perRow);
    const text = rowItems.join("  ");
    out += `<text x="${cx}" y="${startY + r * lineH + 5}" text-anchor="middle" font-size="16" font-weight="600" fill="#0e1a5c">${text}</text>`;
  }
  return out;
}

// Draws the two circles (A and B) and puts the numbers in the
// "only A", "both" (intersection) and "only B" regions.
function drawVenn(onlyA, both, onlyB) {
  $("venn").innerHTML = `
    <circle cx="150" cy="160" r="95" fill="#86e0a0" fill-opacity="0.55" stroke="#5cc47c"/>
    <circle cx="250" cy="160" r="95" fill="#9b87e8" fill-opacity="0.55" stroke="#7a63d6"/>
    <text x="60" y="55" font-size="20" font-weight="700" fill="#4d9f64">A</text>
    <text x="340" y="55" font-size="20" font-weight="700" fill="#7a63d6">B</text>
    ${layoutItems(onlyA, 105, 160, 2)}
    ${layoutItems(both, 200, 160, 1)}
    ${layoutItems(onlyB, 295, 160, 2)}
  `;
}

// SETS CODE
function computeSets() {
  const a = parseList($("setA").value);
  const b = parseList($("setB").value);
  const err = $("setsError");
  if (a === null || b === null) {
    err.textContent = "Please enter numbers separated by commas (e.g. 1, 2, 5).";
    return;
  }
  err.textContent = "";
  const A = uniqSorted(a), B = uniqSorted(b);
  const union = uniqSorted([...A, ...B]);
  const inter = A.filter((x) => B.includes(x));
  const diffAB = A.filter((x) => !B.includes(x));
  const diffBA = B.filter((x) => !A.includes(x));

  $("rUnion").textContent = fmtSet(union);
  $("rInter").textContent = fmtSet(inter);
  $("rDiffAB").textContent = fmtSet(diffAB);
  $("rDiffBA").textContent = fmtSet(diffBA);

  // A is a subset of B if every element of A is also in B.
  const isSubset = A.every((x) => B.includes(x));
  const chip = $("chipSubset");
  chip.textContent = `A ⊆ B ? ${isSubset ? "Yes" : "No"}`;
  chip.className = "chip " + (isSubset ? "chip-yes" : "chip-no");

  // A set with n elements has 2^n subsets.
  const count = 2 ** A.length;
  $("chipCount").innerHTML = `<span class="serif">${count.toLocaleString()}</span> subsets of A`;

  drawVenn(diffAB, inter, diffBA);
}

$("setsCompute").addEventListener("click", computeSets);
["setA", "setB"].forEach((id) => $(id).addEventListener("keydown", (e) => e.key === "Enter" && computeSets()));
drawVenn([], [], []);

/* =========================================================
   ALGORITHMS
   ========================================================= */
function gcdSteps(a, b) {
  const steps = [];
  let x = a, y = b;
  while (y !== 0) {
    const q = Math.floor(x / y), r = x % y;
    steps.push(`${x} = ${y} × ${q} + ${r}`);
    x = y;
    y = r;
  }
  return { gcd: x, steps };
}

function setAlgoOutput(label1, val1, label2, val2, title, steps) {
  $("statLabel1").textContent = label1;
  $("statGcd").textContent = val1;
  $("statLabel2").textContent = label2;
  $("statLcm").textContent = val2;
  $("stepsTitle").textContent = title;
  $("algoSteps").innerHTML = steps.map((s, i) => `<li class="${i === steps.length - 1 ? "final" : ""}">${s}</li>`).join("");
}

function readInt(id) {
  const v = $(id).value;
  if (v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
}

function setBVisible(show) {
  $("fieldB").classList.toggle("hidden", !show);
  if (!show) $("valB").value = "";
}

// GCD & LCM button
$("btnGcd").addEventListener("click", () => {
  setBVisible(true);
  const a = readInt("valA"), b = readInt("valB");
  const err = $("algoError");
  if (a === null || b === null || Number.isNaN(a) || Number.isNaN(b)) {
    err.textContent = "Enter two whole numbers (0 or more) for A and B.";
    return;
  }
  if (a === 0 && b === 0) { err.textContent = "GCD of 0 and 0 is undefined."; return; }
  err.textContent = "";
  const { gcd, steps } = gcdSteps(a, b);
  const lcm = (a / gcd) * b;
  steps.push(`GCD(${a}, ${b}) = ${gcd}`);
  steps.push(`LCM = (${a} × ${b}) ÷ ${gcd} = ${lcm}`);
  setAlgoOutput("GCD", gcd, "LCM", lcm, "Euclidean Steps", steps);
});

// A! button
$("btnFact").addEventListener("click", () => {
  setBVisible(false);
  const a = readInt("valA");
  const err = $("algoError");
  if (a === null || Number.isNaN(a)) { err.textContent = "Enter a whole number for A."; return; }
  if (a > 170) { err.textContent = "Please use A ≤ 170 for factorial."; return; }
  err.textContent = "";
  let result = 1;
  const steps = [];
  for (let i = 2; i <= a; i++) {
    result *= i;
    steps.push(`${i - 1}! × ${i} = ${i}! = ${result.toLocaleString()}`);
  }
  if (!steps.length) steps.push(`${a}! = 1 (by definition)`);
  else steps.push(`${a}! = ${result.toLocaleString()}`);
  setAlgoOutput("Number", a, "Factorial", a <= 20 ? result.toLocaleString() : result.toExponential(4), "Factorial Steps", steps);
});

// Is prime? button
$("btnPrime").addEventListener("click", () => {
  setBVisible(false);
  const a = readInt("valA");
  const err = $("algoError");
  if (a === null || Number.isNaN(a)) { err.textContent = "Enter a whole number for A."; return; }
  err.textContent = "";
  const steps = [];
  let prime = a >= 2;
  if (a < 2) {
    steps.push(`${a} is less than 2, so it is not prime.`);
  } else {
    const limit = Math.floor(Math.sqrt(a));
    steps.push(`Only need to test divisors up to √${a} ≈ ${limit}.`);
    for (let d = 2; d <= limit; d++) {
      if (a % d === 0) {
        steps.push(`${a} ÷ ${d} = ${a / d} with remainder 0 → divisible`);
        prime = false;
        break;
      }
      steps.push(`${a} ÷ ${d} leaves remainder ${a % d}`);
    }
    steps.push(prime ? `No divisor found, so ${a} is prime.` : `${a} is composite.`);
  }
  setAlgoOutput("Number", a, "Prime?", prime ? "Yes" : "No", "Primality Steps", steps);
});

/* =========================================================
   LOGIC  (tokenizer + recursive descent parser)
   Precedence (high→low): NOT, AND, XOR, OR, ->, <->
   ========================================================= */
function tokenize(src) {
  const re = /\s*(<->|<=>|<>|->|=>|↔|→|∧|∨|⊕|¬|[()&|^!~]|[A-Za-z_][A-Za-z0-9_]*)/y;
  const tokens = [];
  let m;
  src = src.trim();
  re.lastIndex = 0;
  while (re.lastIndex < src.length) {
    m = re.exec(src);
    if (!m) throw new Error(`Unexpected character near "${src.slice(re.lastIndex, re.lastIndex + 5).trim()}"`);
    tokens.push(normToken(m[1]));
  }
  return tokens;
}

function normToken(t) {
  const u = t.toUpperCase();
  if (["AND", "&", "∧"].includes(u)) return "AND";
  if (["OR", "|", "∨"].includes(u)) return "OR";
  if (["XOR", "^", "⊕"].includes(u)) return "XOR";
  if (["NOT", "!", "~", "¬"].includes(u)) return "NOT";
  if (["->", "=>", "→"].includes(u)) return "IMP";
  if (["<->", "<=>", "<>", "↔"].includes(u)) return "IFF";
  return t;
}

function parseExpr(src) {
  const tokens = tokenize(src);
  if (!tokens.length) throw new Error("Expression is empty.");
  let pos = 0;
  const vars = new Set();
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function iff() {
    let left = imp();
    while (peek() === "IFF") { next(); const r = imp(); const l = left; left = (e) => l(e) === r(e); }
    return left;
  }
  function imp() {
    const left = or();
    if (peek() === "IMP") { next(); const r = imp(); return (e) => !left(e) || r(e); }
    return left;
  }
  function or() {
    let left = xor();
    while (peek() === "OR") { next(); const r = xor(); const l = left; left = (e) => l(e) || r(e); }
    return left;
  }
  function xor() {
    let left = and();
    while (peek() === "XOR") { next(); const r = and(); const l = left; left = (e) => l(e) !== r(e); }
    return left;
  }
  function and() {
    let left = not();
    while (peek() === "AND") { next(); const r = not(); const l = left; left = (e) => l(e) && r(e); }
    return left;
  }
  function not() {
    if (peek() === "NOT") { next(); const f = not(); return (e) => !f(e); }
    return atom();
  }
  function atom() {
    const t = next();
    if (t === undefined) throw new Error("Expression ended unexpectedly.");
    if (t === "(") {
      const f = iff();
      if (next() !== ")") throw new Error("Missing closing parenthesis.");
      return f;
    }
    if (/^[A-Za-z_]/.test(t) && !["AND", "OR", "XOR", "NOT", "IMP", "IFF"].includes(t)) {
      if (t.toUpperCase() === "T" || t.toUpperCase() === "TRUE") return () => true;
      if (t.toUpperCase() === "F" || t.toUpperCase() === "FALSE") return () => false;
      vars.add(t);
      return (e) => e[t];
    }
    throw new Error(`Unexpected "${t}".`);
  }

  const fn = iff();
  if (pos < tokens.length) throw new Error(`Unexpected "${tokens[pos]}".`);
  return { fn, vars: [...vars].sort() };
}

function allAssignments(vars) {
  const n = vars.length;
  const rows = [];
  for (let i = 0; i < 2 ** n; i++) {
    const env = {};
    // row 0 = all True, last row = all False (the usual truth-table order)
    vars.forEach((v, j) => (env[v] = !((i >> (n - 1 - j)) & 1)));
    rows.push(env);
  }
  return rows;
}

const TF = (b) => (b ? "T" : "F");

// Truth Table button
function showTruth() {
  const src = $("expr1").value;
  const verdict = $("verdict");
  try {
    const { fn, vars } = parseExpr(src);
    if (vars.length > 6) throw new Error("Please use at most 6 variables.");
    const rows = allAssignments(vars);
    const results = rows.map((env) => fn(env));
    let html = `<table class="truth"><thead><tr>${vars.map((v) => `<th>${v}</th>`).join("")}<th class="res">Result</th></tr></thead><tbody>`;
    rows.forEach((env, i) => {
      html += "<tr>" + vars.map((v) => `<td class="${env[v] ? "t" : "f"}">${TF(env[v])}</td>`).join("") +
        `<td class="${results[i] ? "t" : "f"}">${TF(results[i])}</td></tr>`;
    });
    html += "</tbody></table>";
    $("truthWrap").innerHTML = vars.length ? html : `<p class="muted">Result: ${TF(results[0])}</p>`;

    const trues = results.filter(Boolean).length;
    let kind, cls;
    if (trues === rows.length) { kind = "Tautology: always true"; cls = "good"; }
    else if (trues === 0) { kind = "Contradiction: always false"; cls = "bad"; }
    else { kind = `Contingency: true in ${trues} of ${rows.length} rows`; cls = ""; }
    verdict.innerHTML = `<div class="note ${cls}">${rows.length} rows. ${kind}</div>`;
  } catch (e) {
    $("truthWrap").innerHTML = "";
    verdict.innerHTML = `<div class="note bad">${e.message}</div>`;
  }
}

function checkEquivalence() {
  const verdict = $("verdict");
  try {
    const p1 = parseExpr($("expr1").value);
    const p2 = parseExpr($("expr2").value);
    const vars = [...new Set([...p1.vars, ...p2.vars])].sort();
    if (vars.length > 6) throw new Error("Please use at most 6 variables.");
    const rows = allAssignments(vars);
    const diff = rows.find((env) => p1.fn(env) !== p2.fn(env));

    showTruthQuiet(p1, vars, rows);

    if (!diff) {
      verdict.innerHTML = `<div class="note good">Equivalent. Both expressions give the same result in all ${rows.length} rows.</div>`;
    } else {
      const desc = vars.map((v) => `${v} = ${TF(diff[v])}`).join(", ");
      verdict.innerHTML = `<div class="note bad">Not equivalent.<br>They differ when ${desc}<br>
        Expression 1 = ${TF(p1.fn(diff))}, Expression 2 = ${TF(p2.fn(diff))}</div>`;
    }
  } catch (e) {
    verdict.innerHTML = `<div class="note bad">${e.message}</div>`;
  }
}

function showTruthQuiet(p, vars, rows) {
  let html = `<table class="truth"><thead><tr>${vars.map((v) => `<th>${v}</th>`).join("")}<th class="res">Result</th></tr></thead><tbody>`;
  rows.forEach((env) => {
    const r = p.fn(env);
    html += "<tr>" + vars.map((v) => `<td class="${env[v] ? "t" : "f"}">${TF(env[v])}</td>`).join("") +
      `<td class="${r ? "t" : "f"}">${TF(r)}</td></tr>`;
  });
  $("truthWrap").innerHTML = html + "</tbody></table>";
}

$("btnTruth").addEventListener("click", showTruth);
$("btnEquiv").addEventListener("click", checkEquivalence);

/* =========================================================
   SORT & SEARCH
   ========================================================= */
// BUBBLE SORT: compare neighbours and swap them if they are in the wrong order.
function bubbleFrames(input) {
  const a = [...input], frames = [], sorted = new Set();
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      const swap = a[j] > a[j + 1];
      frames.push({ arr: [...a], comparing: [j, j + 1], sorted: [...sorted],
        msg: `Index ${j}: Compare ${a[j]} and ${a[j + 1]}, ${a[j]} ${swap ? ">" : "≤"} ${a[j + 1]}${swap ? ", swap" : ", no swap"}` });
      if (swap) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        frames.push({ arr: [...a], comparing: [j, j + 1], sorted: [...sorted], msg: `Swapped → [${a.join(", ")}]` });
      }
    }
    sorted.add(n - i - 1);
  }
  sorted.add(0);
  frames.push({ arr: [...a], comparing: [], sorted: [...sorted], msg: "Done. List is sorted." });
  return frames;
}

// SELECTION SORT
function selectionFrames(input) {
  const a = [...input], frames = [], sorted = [];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      const less = a[j] < a[min];
      frames.push({ arr: [...a], comparing: [min, j], sorted: [...sorted],
        msg: `Pass ${i + 1}: Compare ${a[j]} with current minimum ${a[min]}${less ? " → new minimum" : ""}` });
      // Remember the position of the smallest value found so far.
      if (less) min = j;
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      frames.push({ arr: [...a], comparing: [i, min], sorted: [...sorted], msg: `Swap ${a[min]} and ${a[i]} → [${a.join(", ")}]` });
    }
    sorted.push(i);
  }
  sorted.push(n - 1);
  frames.push({ arr: [...a], comparing: [], sorted: [...sorted], msg: "Done. List is sorted." });
  return frames;
}

// INSERTION SORT
function insertionFrames(input) {
  const a = [...input], frames = [];
  const n = a.length;
  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0) {
      const move = a[j - 1] > a[j];
      frames.push({ arr: [...a], comparing: [j - 1, j], sorted: [],
        msg: `Insert ${a[j]}: compare with ${a[j - 1]}, ${a[j - 1]} ${move ? ">" : "≤"} ${a[j]}${move ? ", shift" : ", stop"}` });
      if (!move) break;
      [a[j - 1], a[j]] = [a[j], a[j - 1]];
      j--;
    }
  }
  frames.push({ arr: [...a], comparing: [], sorted: a.map((_, i) => i), msg: "Done. List is sorted." });
  return frames;
}

// LINEAR SEARCH
function linearFrames(input, target) {
  const a = [...input], frames = [];
  for (let i = 0; i < a.length; i++) {
    const hit = a[i] === target;
    frames.push({ arr: a, comparing: [i], sorted: [], found: hit ? i : null,
      msg: `Index ${i}: ${a[i]} ${hit ? "=" : "≠"} ${target}${hit ? " → found!" : ""}` });
    if (hit) return frames;
  }
  frames.push({ arr: a, comparing: [], sorted: [], found: null, msg: `${target} is not in the list.` });
  return frames;
}

// BINARY SEARCH
function binaryFrames(input, target) {
  const a = [...input].sort((x, y) => x - y), frames = [];
  frames.push({ arr: a, comparing: [], sorted: a.map((_, i) => i), found: null, msg: `Binary search needs a sorted list → [${a.join(", ")}]` });
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    // Middle position of the part of the list still being searched.
    const mid = Math.floor((lo + hi) / 2);
    if (a[mid] === target) {
      frames.push({ arr: a, comparing: [mid], sorted: [], found: mid, msg: `Low=${lo}, High=${hi}, Mid=${mid}: ${a[mid]} = ${target} → found!` });
      return frames;
    }
    const goRight = a[mid] < target;
    frames.push({ arr: a, comparing: [mid], sorted: [], found: null,
      msg: `Low=${lo}, High=${hi}, Mid=${mid}: ${a[mid]} ${goRight ? "<" : ">"} ${target}, search ${goRight ? "right" : "left"} half` });
    if (goRight) lo = mid + 1; else hi = mid - 1;
  }
  frames.push({ arr: a, comparing: [], sorted: [], found: null, msg: `${target} is not in the list.` });
  return frames;
}

let animTimer = null;

function renderBars(arr, comparing = [], sorted = [], found = null) {
  const max = Math.max(...arr, 1);
  const min = Math.min(...arr, 0);
  const range = max - min || 1;
  $("bars").innerHTML = arr.map((v, i) => {
    const h = 25 + ((v - min) / range) * 75; // 25%–100%
    let cls = "bar";
    if (found === i) cls += " found";
    else if (comparing.includes(i)) cls += " comparing";
    else if (sorted.includes(i)) cls += " sorted";
    return `<div class="${cls}" style="height:${h}%">${v}</div>`;
  }).join("");
}

function runSortSearch() {
  const err = $("sortError");
  const nums = parseList($("listNums").value);
  const algo = $("algoSelect").value;
  const targetRaw = $("targetNum").value;
  clearInterval(animTimer);

  if (!nums || !nums.length) { err.textContent = "Enter a list of numbers separated by commas."; return; }
  if (nums.length > 15) { err.textContent = "Please use 15 numbers or fewer."; return; }
  if (!algo) { err.textContent = "Pick an algorithm first."; return; }
  const isSearch = algo === "linear" || algo === "binary";
  if (isSearch && targetRaw === "") { err.textContent = "Enter a target value for searching."; return; }
  err.textContent = "";

  const target = Number(targetRaw);
  const frames = {
    bubble: () => bubbleFrames(nums),
    selection: () => selectionFrames(nums),
    insertion: () => insertionFrames(nums),
    linear: () => linearFrames(nums, target),
    binary: () => binaryFrames(nums, target),
  }[algo]();

  const log = $("sortLog");
  log.innerHTML = "";
  log.classList.add("show");
  $("btnRun").disabled = true;

  let i = 0;
  const step = () => {
    const f = frames[i];
    renderBars(f.arr, f.comparing, f.sorted, f.found ?? null);
    log.querySelectorAll("p.current").forEach((p) => p.classList.remove("current"));
    const p = document.createElement("p");
    p.className = "current";
    p.textContent = f.msg;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
    i++;
    if (i >= frames.length) {
      clearInterval(animTimer);
      $("btnRun").disabled = false;
    }
  };
  step();
  if (frames.length > 1) animTimer = setInterval(step, 650);
  else $("btnRun").disabled = false;
}
$("btnRun").addEventListener("click", runSortSearch);

renderBars([5, 10, 7, 15, 8], [1, 2], [0]);