(() => {
  const tabs = [...document.querySelectorAll('.feature-pills [role="tab"]')];
  const panels = [...document.querySelectorAll(".feature-example")];
  const carousel = document.querySelector(".feature-examples");
  const counter = document.querySelector(".feature-counter");
  if (!tabs.length || !panels.length || !carousel) return;

  let activeIndex = Math.max(0, tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true"));
  let pointerStart = null;
  let dragX = 0;

  function select(index, moveFocus = false) {
    activeIndex = (index + tabs.length) % tabs.length;
    const activeTab = tabs[activeIndex];
    tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === activeIndex;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel, panelIndex) => {
      const active = panelIndex === activeIndex;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    if (counter) counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(tabs.length).padStart(2, "0")}`;
    if (moveFocus) activeTab.focus();
  }

  function selectFromHash() {
    const match = location.hash.match(/^#feature-tab-(.+)$/);
    if (!match) return;
    const target = tabs.findIndex((tab) => tab.id === `feature-tab-${match[1]}`);
    if (target >= 0) select(target);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(index));
    tab.addEventListener("keydown", (event) => {
      let next = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      select(next, true);
    });
  });

  document.querySelectorAll(".feature-arrow").forEach((button) => {
    button.addEventListener("click", () => select(activeIndex + Number(button.dataset.direction)));
  });

  carousel.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("a,button")) return;
    pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    dragX = 0;
  });
  carousel.addEventListener("pointermove", (event) => {
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    dragX = event.clientX - pointerStart.x;
    const dragY = event.clientY - pointerStart.y;
    if (Math.abs(dragX) > Math.abs(dragY) + 8) {
      carousel.classList.add("is-dragging");
      carousel.setPointerCapture(event.pointerId);
      panels[activeIndex].style.transform = `translateX(${dragX * 0.35}px)`;
    }
  });
  function finishDrag(event) {
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    panels.forEach((panel) => (panel.style.transform = ""));
    carousel.classList.remove("is-dragging");
    const width = carousel.getBoundingClientRect().width;
    if (Math.abs(dragX) > Math.min(90, width * 0.18)) select(activeIndex + (dragX < 0 ? 1 : -1));
    pointerStart = null;
    dragX = 0;
  }
  carousel.addEventListener("pointerup", finishDrag);
  carousel.addEventListener("pointercancel", finishDrag);

  select(activeIndex);
  selectFromHash();
  window.addEventListener("hashchange", selectFromHash);
})();
