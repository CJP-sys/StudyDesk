/* Popup forms for add/edit and confirm dialogs */
function fld(f, v) {
  const val = v[f.n] ?? f.d ?? "",
    r = f.q ? "required" : "";
  let i;
  if (f.t == "textarea")
    i = `<textarea name="${f.n}" rows="${f.r || 3}" ${r}>${esc(val)}</textarea>`;
  else if (f.t == "select")
    i = `<select name="${f.n}" ${r}>${f.o.map((o) => `<option value="${esc(o.v)}" ${o.v == val ? "selected" : ""}>${esc(o.l)}</option>`).join("")}</select>`;
  else
    i = `<input name="${f.n}" type="${f.t || "text"}" value="${esc(val)}" ${r}>`;
  return `<label>${f.l}${i}</label>`;
}
function modal(title, fields, vals, cb) {
  $("#modal").innerHTML =
    `<div class="mb"><form class="mc"><h2>${title}</h2>${fields.map((f) => fld(f, vals)).join("")}<div class="row"><button type="button" class="btn ghost" data-a="close">Cancel</button><button class="btn">Save</button></div></form></div>`;
  $("#modal form").onsubmit = (e) => {
    e.preventDefault();
    cb(Object.fromEntries(new FormData(e.target)));
    $("#modal").innerHTML = "";
    save();
    render();
    toast("Saved.");
  };
  const f = $("#modal input,#modal textarea");
  f && f.focus();
}
function ask(msg, fn) {
  pend = fn;
  $("#modal").innerHTML =
    `<div class="mb"><div class="mc"><p>${msg}</p><div class="row"><button class="btn ghost" data-a="close">Keep it</button><button class="btn danger" data-a="yes">Delete</button></div></div></div>`;
}
const TYPES = ["assignment", "project", "quiz", "exam"].map((v) => ({
  v,
  l: v[0].toUpperCase() + v.slice(1),
}));
const KIND = {
  subjects: {
    t: "subject",
    f: () => [
      { n: "name", l: "Subject name", q: 1 },
      { n: "color", l: "Colour", t: "color", d: "#2f4ec4" },
    ],
  },
  notes: {
    t: "note",
    f: () => [
      { n: "title", l: "Title", q: 1 },
      { n: "sid", l: "Subject", t: "select", o: subjOpts(), q: 1 },
      { n: "date", l: "Date", t: "date", d: today(), q: 1 },
      { n: "text", l: "Note", t: "textarea", r: 7 },
    ],
  },
  tasks: {
    t: "task",
    f: () => [
      { n: "title", l: "Title", q: 1 },
      { n: "sid", l: "Subject", t: "select", o: subjOpts(), q: 1 },
      { n: "due", l: "Deadline", t: "date", d: today(), q: 1 },
      { n: "type", l: "Type", t: "select", o: TYPES },
      {
        n: "pri",
        l: "Priority",
        t: "select",
        d: "medium",
        o: ["low", "medium", "high"].map((v) => ({
          v,
          l: v[0].toUpperCase() + v.slice(1),
        })),
      },
      {
        n: "status",
        l: "Status",
        t: "select",
        o: [
          { v: "pending", l: "Pending" },
          { v: "in_progress", l: "In progress" },
          { v: "completed", l: "Completed" },
        ],
      },
    ],
  },
  cards: {
    t: "flashcard",
    f: () => [
      { n: "sid", l: "Subject", t: "select", o: subjOpts(), q: 1 },
      { n: "topic", l: "Topic (optional)" },
      { n: "front", l: "Front (question)", t: "textarea", q: 1 },
      { n: "back", l: "Back (answer)", t: "textarea", q: 1 },
    ],
  },
  plans: {
    t: "study plan",
    f: () => [
      { n: "title", l: "Plan name", q: 1 },
      { n: "sid", l: "Subject", t: "select", o: subjOpts(), q: 1 },
      { n: "goal", l: "What do you want to learn?", t: "textarea", r: 3, q: 1 },
      { n: "start", l: "Start date", t: "date", d: today(), q: 1 },
      { n: "end", l: "Target date", t: "date", d: today(), q: 1 },
    ],
  },
};
