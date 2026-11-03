/* Button clicks, dropdown changes and keyboard shortcuts */
const A = {
  nav: (_, b) => {
    view = b.dataset.v;
    location.hash = view;
    render();
  },
  gameStart: () => {
    const shuffled = [...D.cards].sort(() => Math.random() - .5).slice(0, 10);
    G = { on: true, index: 0, score: 0, answered: false, deck: shuffled.map((c) => ({ ...c, options: [...new Set([c.back, ...D.cards.filter((x) => x.id != c.id).sort(() => Math.random() - .5).slice(0, 3).map((x) => x.back)])].sort(() => Math.random() - .5) })) };
    render();
  },
  gameAnswer: (_, b) => {
    if (G.answered) return;
    const card = G.deck[G.index];
    G.selected = card.options[+b.dataset.i];
    G.answered = true;
    if (G.selected == card.back) G.score++;
    render();
  },
  gameNext: () => { G.index++; G.answered = false; G.selected = ""; render(); },
  gameStop: () => { G.on = false; render(); },
  close: () => {
    $("#modal").innerHTML = "";
  },
  logout: async () => {
    try {
      await clearSession();
      U = D = null;
      window.location.replace("login.html");
    } catch (error) {
      toast(`Could not log out: ${error.message}`);
    }
  },
  yes: () => {
    $("#modal").innerHTML = "";
    pend && pend();
    pend = null;
  },
  edit: (id, b) => {
    const k = b.dataset.k;
    if (k != "subjects" && !D.subjects.length)
      return toast("Add a subject first.");
    const it = id ? D[k].find((x) => x.id == id) : {};
    modal((id ? "Edit " : "Add ") + KIND[k].t, KIND[k].f(), it, (v) => {
      if (v.sid) v.sid = +v.sid;
      if (id) Object.assign(it, v);
      else {
        if (k == "cards") Object.assign(v, { status: "new", times: 0 });
        D[k].push({ id: D.n++, ...v });
      }
    });
  },
  del: (id, b) => {
    const k = b.dataset.k;
    ask(
      "Delete this " +
        KIND[k].t +
        " permanently?" +
        (k == "subjects"
          ? " Its notes, tasks and flashcards will be deleted too."
          : ""),
      () => {
        D[k] = D[k].filter((x) => x.id != id);
        if (k == "subjects")
          ["notes", "tasks", "cards", "plans", "log"].forEach(
            (c) => (D[c] = D[c].filter((x) => x.sid != id)),
          );
        save();
        render();
      },
    );
  },
  tf: (_, b) => {
    TF = b.dataset.v;
    render();
  },
  start: () => {
    let l = D.cards.filter(
      (c) => (!R.sid || c.sid == R.sid) && (!R.only || c.status != "known"),
    );
    const w = { review: 0, new: 1, known: 2 };
    l = l
      .map((c) => [w[c.status] + Math.random() * 0.9, c])
      .sort((a, b) => a[0] - b[0])
      .map((x) => x[1]);
    R = { ...R, on: true, list: l, i: 0, kn: 0, rv: 0, f: false };
    render();
  },
  stop: () => {
    R.on = false;
    render();
  },
  flip: () => {
    R.f = !R.f;
    $(".flip").classList.toggle("f", R.f);
    $("#ans").style.visibility = "visible";
  },
  mark: (r) => {
    const c = D.cards.find((x) => x.id == R.list[R.i].id);
    c.status = r;
    c.times++;
    D.log.push({ d: today(), r, sid: c.sid });
    r == "known" ? R.kn++ : R.rv++;
    R.i++;
    R.f = false;
    save();
    render();
  },
};
const C = {
  tstatus: (el) => {
    D.tasks.find((t) => t.id == el.dataset.id).status = el.value;
    save();
    render();
  },
  nsub: (el) => {
    Q.s = el.value;
    $("#nl").innerHTML = noteList();
  },
  csub: (el) => {
    CF = el.value;
    render();
  },
  rsub: (el) => {
    R.sid = el.value;
  },
  ronly: (el) => {
    R.only = el.checked;
  },
};
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-a]");
  if (b) A[b.dataset.a]?.(b.dataset.id || b.dataset.r, b);
});
document.addEventListener("change", (e) => {
  const c = e.target.dataset.c;
  if (c) C[c](e.target);
});
document.addEventListener("input", (e) => {
  if (e.target.id == "q") {
    Q.q = e.target.value;
    $("#nl").innerHTML = noteList();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.target.matches("input,textarea,select")) return;
  if (
    view == "review" &&
    R.on &&
    R.i < R.list.length &&
    !$("#modal").innerHTML &&
    (e.key == " " || e.key == "Enter")
  ) {
    e.preventDefault();
    A.flip();
  }
});
window.addEventListener("hashchange", () => {
  const h = location.hash.slice(1);
  if (U && NAV.some((n) => n[0] == h) && h != view) {
    view = h;
    render();
  }
});
