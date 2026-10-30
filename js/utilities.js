/* Helpers, saved data and page state */
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const mem = {};
const store = {
  get(k) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : (mem[k] ?? null);
    } catch (e) {
      return mem[k] ?? null;
    }
  },
  set(k, v) {
    mem[k] = v;
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  },
};
const today = () => new Date().toLocaleDateString("en-CA");
const fmt = (d) =>
  new Date(d + "T00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
let U = null,
  D = null,
  view = "dashboard",
  authMode = "login",
  Q = { q: "", s: "" },
  TF = "all",
  CF = "",
  pend = null;
let R = {
  on: false,
  list: [],
  i: 0,
  kn: 0,
  rv: 0,
  f: false,
  sid: "",
  only: false,
};
let G = { on: false, index: 0, score: 0, answered: false, deck: [] };
const NAV = [
  ["notes", "Notes"],
  ["tasks", "Tasks"],
  ["cards", "Flashcards"],
  ["plans", "Study plans"],
  ["progress", "Progress"],
  ["arcade", "Arcade"],
];
const save = () => store.set("sd_data_" + U.id, D);
const sub = (id) =>
  D.subjects.find((s) => s.id == id) || { name: "Unknown", color: "#999" };
const subjOpts = () => D.subjects.map((s) => ({ v: s.id, l: s.name }));
const toast = (m) => {
  const t = $("#toast");
  t.textContent = m;
  t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.hidden = true), 2500);
};
const bar = (p, c) =>
  `<div class="bar"><i style="width:${p}%;background:${c || "var(--blue)"}"></i></div>`;
const hd = (t, b = "") => `<div class="hd"><h1>${t}</h1><div>${b}</div></div>`;
const add = (k, l) =>
  `<button class="btn" data-a="edit" data-k="${k}">${l}</button>`;
const rb = (k, id) =>
  `<button class="btn sm ghost" data-a="edit" data-k="${k}" data-id="${id}">Edit</button> <button class="btn sm danger" data-a="del" data-k="${k}" data-id="${id}">Delete</button>`;
const needSub = () =>
  D.subjects.length
    ? ""
    : `<div class="card">Add a subject first, then attach notes, tasks and flashcards to it. <button class="btn sm" data-a="nav" data-v="subjects">Go to Subjects</button></div>`;
const subSel = (id, val, all) =>
  `<select data-c="${id}">${all ? '<option value="">All subjects</option>' : ""}${D.subjects.map((s) => `<option value="${s.id}" ${s.id == val ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select>`;
