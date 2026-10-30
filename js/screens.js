/* The seven screens: dashboard, subjects, notes, tasks, cards, review, progress */
function stats() {
  const t = D.tasks,
    c = D.cards;
  return {
    open: t.filter((x) => x.status != "completed").length,
    done: t.filter((x) => x.status == "completed").length,
    over: t.filter((x) => x.status != "completed" && x.due < today()).length,
    known: c.filter((x) => x.status == "known").length,
  };
}
const V = {
  dashboard() {
    const s = stats(),
      all = s.open + s.done + D.cards.length,
      o = pct(s.done + s.known, all);
    const up = D.tasks
      .filter((t) => t.status != "completed")
      .sort((a, b) => (a.due < b.due ? -1 : 1))
      .slice(0, 4);
    const todayLabel = new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(new Date()).toUpperCase();
    const dateLabel = new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric" }).format(new Date());
    return (
      `<section class="desk-welcome"><div><p class="desk-eyebrow">${todayLabel} · ${dateLabel.toUpperCase()}</p><h1>Your study space</h1><p>All the little things you’re working toward.</p></div><button class="desk-primary" data-a="nav" data-v="plans">Open my study plan <span>↗</span></button></section>
      <section class="desk-stats"><article><span>Tasks to do</span><b>${String(s.open).padStart(2, "0")}</b><small>${s.over ? `${s.over} overdue · take one step at a time` : "One small step at a time"}</small></article><article><span>Notes saved</span><b>${String(D.notes.length).padStart(2, "0")}</b><small>Your ideas, all together</small></article><article><span>Cards mastered</span><b>${String(s.known).padStart(2, "0")}</b><small>${D.cards.length ? `${s.known} of ${D.cards.length} cards` : "Keep the streak going"}</small></article></section>
      <section class="desk-lower"><article class="desk-list"><div class="desk-card-heading"><div><span class="desk-eyebrow">UP NEXT</span><h2>Your study plan</h2></div><button class="desk-view-all" data-a="nav" data-v="tasks">View tasks ↗</button></div>${up.map((t) => `<div class="desk-row"><i class="desk-check ${t.status == "completed" ? "checked" : ""}">${t.status == "completed" ? "✓" : ""}</i><span><b>${esc(t.title)}</b><small>${esc(sub(t.sid).name)} · ${fmt(t.due)}</small></span><em class="${t.due < today() ? "red" : ""}">${t.due < today() ? "Overdue" : t.type}</em></div>`).join("") || '<div class="desk-empty">Nothing coming up. Add a task to get started.</div>'}<button class="desk-add" data-a="edit" data-k="tasks">+ Add a task</button></article><article class="desk-progress"><span class="desk-eyebrow">YOUR MOMENTUM</span><h2>Showing up adds up.</h2><div class="progress-ring" style="--progress:${o}%"><div><b>${o}%</b><small>overall progress</small></div></div><p>${all ? "Nice work. You’re building a good rhythm." : "Add tasks and flashcards to start tracking your progress."}</p><button class="desk-view-all" data-a="nav" data-v="progress">See your progress ↗</button></article></section>`
    );
  },
  subjects() {
    return (
      hd("Subjects", add("subjects", "Add subject")) +
      `<div class="grid">${D.subjects.map((s) => `<div class="card tag" style="--c:${s.color}"><h2>${esc(s.name)}</h2><p class="mut">${D.notes.filter((x) => x.sid == s.id).length} notes · ${D.tasks.filter((x) => x.sid == s.id).length} tasks · ${D.cards.filter((x) => x.sid == s.id).length} cards</p>${rb("subjects", s.id)}</div>`).join("")}</div>` +
      (D.subjects.length
        ? ""
        : '<div class="empty">No subjects yet. Add one like “Biology” or “Algebra” to get started.</div>')
    );
  },
  notes() {
    return (
      hd("Notes", `<button class="btn ghost" data-a="nav" data-v="subjects">Subjects</button> ${add("notes", "Add note")}`) +
      needSub() +
      `<div class="grid" style="grid-template-columns:2fr 1fr"><input id="q" placeholder="Search titles and note text" value="${esc(Q.q)}">${subSel("nsub", Q.s, 1)}</div><div id="nl">${noteList()}</div>`
    );
  },
  tasks() {
    const f = [
      ["all", "All"],
      ["pending", "Pending"],
      ["in_progress", "In progress"],
      ["completed", "Completed"],
      ["overdue", "Overdue"],
    ];
    let l = D.tasks.filter(
      (t) =>
        TF == "all" ||
        (TF == "overdue"
          ? t.status != "completed" && t.due < today()
          : t.status == TF),
    );
    l.sort(
      (a, b) =>
        (a.status == "completed") - (b.status == "completed") ||
        (a.due < b.due ? -1 : 1),
    );
    return (
      hd("Tasks", `<button class="btn ghost" data-a="nav" data-v="subjects">Subjects</button> ${add("tasks", "Add task")}`) +
      needSub() +
      `<div class="pills">${f.map((x) => `<button class="${TF == x[0] ? "on" : ""}" data-a="tf" data-v="${x[0]}">${x[1]}</button>`).join("")}</div>
 <div class="card tw" style="padding:0"><table><thead><tr><th>Task</th><th>Due</th><th>Priority</th><th>Status</th><th></th></tr></thead>${
   l
     .map((t) => {
       const late = t.status != "completed" && t.due < today();
       return `<tr class="${late ? "late" : ""}"><td><strong>${esc(t.title)}</strong><br><span class="mut">${esc(sub(t.sid).name)} · ${t.type}</span></td><td>${fmt(t.due)}${late ? '<br><span class="red mut">Overdue</span>' : ""}</td><td><span class="badge">${t.pri}</span></td>
 <td><select data-c="tstatus" data-id="${t.id}" aria-label="Status">${[
   ["pending", "Pending"],
   ["in_progress", "In progress"],
   ["completed", "Completed"],
 ]
   .map(
     (o) =>
       `<option value="${o[0]}" ${t.status == o[0] ? "selected" : ""}>${o[1]}</option>`,
   )
   .join("")}</select></td><td class="row">${rb("tasks", t.id)}</td></tr>`;
     })
     .join("") ||
   '<tr><td colspan="5" class="empty">No tasks here. Add an assignment, quiz or exam to track it.</td></tr>'
 }</table></div>`
    );
  },
  cards() {
    const l = D.cards.filter((c) => !CF || c.sid == CF),
      L = { known: "Known", review: "Need review", new: "New" };
    return (
      hd(
        "Flashcards",
        `<button class="btn ghost" data-a="nav" data-v="subjects">Subjects</button> <button class="btn ghost" data-a="nav" data-v="review">Review cards</button> ${add("cards", "Add card")}`,
      ) +
      needSub() +
      `<p>${subSel("csub", CF, 1)}</p>
 <div class="card tw" style="padding:0"><table><thead><tr><th>Question</th><th>Answer</th><th>Status</th><th></th></tr></thead>${l.map((c) => `<tr><td>${esc(c.front)}<br><span class="mut">${esc(sub(c.sid).name)}${c.topic ? " · " + esc(c.topic) : ""}</span></td><td>${esc(c.back)}</td><td><span class="badge">${L[c.status]}</span><br><span class="mut">Reviewed ${c.times}×</span></td><td class="row">${rb("cards", c.id)}</td></tr>`).join("") || '<tr><td colspan="4" class="empty">No flashcards yet. Add a question and answer to begin.</td></tr>'}</table></div>`
    );
  },
  review() {
    let h = hd("Review cards");
    if (!R.on)
      return (
        h +
        `<div class="card" style="max-width:520px"><label>Subject${subSel("rsub", R.sid, 1)}</label><label style="display:flex;gap:.5rem;align-items:center"><input type="checkbox" data-c="ronly" style="width:auto" ${R.only ? "checked" : ""}> Only new and need-review cards</label><button class="btn" data-a="start">Start review</button><p class="mut">${D.cards.length} flashcards in total.</p></div>`
      );
    if (!R.list.length)
      return (
        h +
        `<div class="empty">No cards match these filters. <button class="btn sm" data-a="stop">Change filters</button></div>`
      );
    if (R.i >= R.list.length)
      return (
        h +
        `<div class="card" style="max-width:520px;text-align:center"><h2>Deck finished</h2><p>You marked <strong>${R.kn}</strong> as known and <strong>${R.rv}</strong> for review.</p><button class="btn" data-a="nav" data-v="progress">See your progress</button> <button class="btn ghost" data-a="stop">Review again</button></div>`
      );
    const c = R.list[R.i];
    return (
      h +
      `<div class="mut row" style="justify-content:space-between;max-width:620px"><span>Card ${R.i + 1} of ${R.list.length}</span><span>${esc(sub(c.sid).name)}${c.topic ? " · " + esc(c.topic) : ""}</span></div>
 <div class="flip ${R.f ? "f" : ""}" data-a="flip" tabindex="0" role="button" aria-label="Flip card"><div class="fi"><div class="face">${esc(c.front)}</div><div class="face bk">${esc(c.back)}</div></div></div>
 <p class="mut">Click the card or press Space to see the answer.</p>
 <div id="ans" class="row" style="justify-content:flex-start;visibility:${R.f ? "visible" : "hidden"}"><button class="btn warn" data-a="mark" data-r="review">Need review</button><button class="btn ok" data-a="mark" data-r="known">I knew it</button></div>`
    );
  },
  plans() {
    return (
      hd("Study plans", add("plans", "Create plan")) +
      needSub() +
      (D.plans.length
        ? `<div class="grid">${D.plans.map((p) => `<article class="card tag" style="--c:${sub(p.sid).color}"><div class="row" style="justify-content:space-between"><h2>${esc(p.title)}</h2><span class="badge">${fmt(p.start)} – ${fmt(p.end)}</span></div><p class="mut">${esc(sub(p.sid).name)}</p><p style="white-space:pre-wrap">${esc(p.goal)}</p>${bar(p.end < today() ? 100 : p.start > today() ? 0 : 50, sub(p.sid).color)}<span class="mut">${p.end < today() ? "Target date passed" : p.start > today() ? "Starts soon" : "In progress"}</span><div class="row">${rb("plans", p.id)}</div></article>`).join("")}</div>`
        : '<div class="card empty">Build a simple plan around a subject, learning goal, and target date. Your plans will live here.</div>')
    );
  },
  arcade() {
    if (!G.on)
      return hd("Study Arcade") + `<div class="card" style="max-width:680px"><h2>Flashcard challenge</h2><p>Turn your flashcards into a quick multiple choice round. Each round uses up to 10 cards.</p><p class="mut">${D.cards.length} ${D.cards.length == 1 ? "card" : "cards"} available</p>${D.cards.length >= 2 ? '<button class="btn" data-a="gameStart">Start a round</button>' : '<div class="empty">Add at least two flashcards to unlock the challenge.</div>'}</div>`;
    if (G.index >= G.deck.length)
      return hd("Round complete") + `<div class="card" style="max-width:600px;text-align:center"><h2>${G.score} / ${G.deck.length} correct</h2><p>Nice work. Play another round to keep practicing.</p><button class="btn" data-a="gameStart">Play again</button> <button class="btn ghost" data-a="gameStop">Done</button></div>`;
    const card = G.deck[G.index];
    return hd("Flashcard challenge") + `<div class="mut">Question ${G.index + 1} of ${G.deck.length} · Score ${G.score}</div><div class="card" style="max-width:680px"><h2>${esc(card.front)}</h2><div class="pills" style="flex-direction:column">${card.options.map((o, i) => `<button class="${G.answered && o == card.back ? "on" : ""}" style="border-radius:.5rem;text-align:left;padding:.7rem" data-a="gameAnswer" data-i="${i}" ${G.answered ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>${G.answered ? `<p>${G.selected == card.back ? "Correct!" : "Not quite — the answer is " + esc(card.back) + "."}</p><button class="btn" data-a="gameNext">${G.index + 1 == G.deck.length ? "See score" : "Next question"}</button>` : ""}</div>`;
  },
  progress() {
    const days = [...Array(14)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 13 + i);
      return d.toLocaleDateString("en-CA");
    });
    const per = days.map((d) => {
      const l = D.log.filter((x) => x.d == d);
      return { d, t: l.length, k: l.filter((x) => x.r == "known").length };
    });
    const mx = Math.max(1, ...per.map((p) => p.t)),
      tot = D.log.length,
      ok = D.log.filter((x) => x.r == "known").length;
    const rows = D.subjects.map((s) => {
      const t = D.tasks.filter((x) => x.sid == s.id),
        c = D.cards.filter((x) => x.sid == s.id),
        td = t.filter((x) => x.status == "completed").length,
        kn = c.filter((x) => x.status == "known").length,
        nd = c.filter((x) => x.status == "review").length;
      const tp = pct(td, t.length),
        cp = pct(kn, c.length),
        p = [t.length && tp, c.length && cp].filter(
          (x, i) => [t.length, c.length][i],
        );
      return {
        s,
        t,
        c,
        td,
        kn,
        tp,
        cp,
        score: p.length
          ? Math.round(p.reduce((a, b) => a + b) / p.length)
          : null,
        weak: c.length && (cp < 60 || nd > 0),
      };
    });
    const tp = {};
    D.cards
      .filter((c) => c.status == "review")
      .forEach((c) => {
        const k = sub(c.sid).name + " – " + (c.topic || "General");
        tp[k] = (tp[k] || 0) + 1;
      });
    const topics = Object.entries(tp)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    return (
      hd("Study progress") +
      `<div class="grid"><div class="card stat"><b>${tot}</b><span>Card reviews so far</span></div><div class="card stat"><b>${pct(ok, tot)}%</b><span>Answered correctly</span></div></div>
 <div class="card"><h2>Last 14 days of flashcard review</h2>${tot ? `<div class="chart">${per.map((p) => `<div title="${fmt(p.d)}: ${p.k} of ${p.t} known"><div class="bars"><i style="height:${(p.t / mx) * 100}%;background:var(--line)"></i><i style="height:${(p.k / mx) * 100}%;background:var(--blue)"></i></div>${p.d.slice(8)}</div>`).join("")}</div><p class="mut">Grey bars are cards reviewed, blue bars are cards you knew. Day of month along the bottom.</p>` : '<div class="empty">Review some flashcards and your trend will show up here.</div>'}</div>
 <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))"><div class="card"><h2>By subject</h2>${rows.map((r) => `<div class="tag" style="--c:${r.s.color}"><div class="row" style="justify-content:space-between"><strong>${esc(r.s.name)}</strong><span>${r.score == null ? "No data yet" : r.score + "%"}</span></div><span class="mut">Tasks ${r.td}/${r.t.length}</span>${bar(r.tp, r.s.color)}<span class="mut">Flashcards mastered ${r.kn}/${r.c.length}</span>${bar(r.cp, r.s.color)}</div>`).join("") || '<div class="empty">Add subjects to see progress.</div>'}</div>
 <div class="card"><h2>Needs more review</h2>${rows
   .filter((r) => r.weak)
   .map(
     (r) =>
       `<div class="row" style="justify-content:space-between"><span>${esc(r.s.name)}</span><span class="mut">${r.cp}% mastered</span></div>`,
   )
   .join(
     "",
   )}${topics.length ? `<hr style="border:0;border-top:1px solid var(--line)"><span class="mut">Topics with cards marked “Need review”</span>${topics.map((t) => `<div class="row" style="justify-content:space-between"><span>${esc(t[0])}</span><span class="badge">${t[1]}</span></div>`).join("")}<p><button class="btn sm" data-a="nav" data-v="review">Review these now</button></p>` : rows.some((r) => r.weak) ? "" : '<div class="empty">Nothing flagged. Keep reviewing to stay sharp.</div>'}</div></div>`
    );
  },
};
function noteList() {
  const q = Q.q.toLowerCase();
  const l = D.notes
    .filter(
      (n) =>
        (!Q.s || n.sid == Q.s) &&
        (!q || (n.title + " " + n.text).toLowerCase().includes(q)),
    )
    .sort((a, b) => (b.date < a.date ? -1 : b.date > a.date ? 1 : b.id - a.id));
  return (
    l
      .map(
        (n) =>
          `<div class="card tag" style="--c:${sub(n.sid).color}"><div class="row" style="justify-content:space-between"><h2>${esc(n.title)}</h2><span class="mut">${fmt(n.date)}</span></div><p class="mut">${esc(sub(n.sid).name)}</p><p style="white-space:pre-wrap">${esc(n.text)}</p>${rb("notes", n.id)}</div>`,
      )
      .join("") ||
    `<div class="empty">${Q.q || Q.s ? "No notes match your search." : "No notes yet. Add one to start building your study library."}</div>`
  );
}
