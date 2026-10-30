(() => {
  const topbar = document.querySelector(".topbar");
  let scrollPending = false;
  const updateTopbar = () => {
    scrollPending = false;
    if (!topbar) return;

    const compact = window.matchMedia("(max-width: 760px)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rawProgress = Math.max(0, Math.min(1, window.scrollY / 120));
    const progress = reduceMotion ? Number(window.scrollY > 48) : 1 - Math.pow(1 - rawProgress, 2.4);
    const startWidth = Math.min(window.innerWidth - (compact ? 28 : 48), 1200);
    const endWidth = window.innerWidth;
    const startHeight = compact ? 58 : 64;
    const endHeight = compact ? 64 : 88;
    const startMargin = compact ? 14 : 24;
    const lerp = (from, to) => from + (to - from) * progress;
    const color = (from, to) => Math.round(lerp(from, to));

    topbar.style.width = `${lerp(startWidth, endWidth)}px`;
    topbar.style.height = `${lerp(startHeight, endHeight)}px`;
    topbar.style.marginTop = `${lerp(startMargin, 0)}px`;
    topbar.style.paddingInline = `${lerp(compact ? 14 : 20, compact ? 16 : 20)}px`;
    topbar.style.borderRadius = `${lerp(40, 0)}px`;
    topbar.style.backgroundColor = `rgb(${color(255, 247)}, ${color(255, 246)}, ${color(255, 240)})`;
    topbar.style.borderColor = `rgba(51, 51, 51, ${1 - progress})`;
    topbar.style.boxShadow = `inset 0 -1px rgba(228, 226, 219, ${progress}), 0 4px 16px rgba(36, 26, 45, ${progress * .07})`;
  };
  const requestTopbarUpdate = () => {
    if (scrollPending) return;
    scrollPending = true;
    requestAnimationFrame(updateTopbar);
  };
  window.addEventListener("scroll", requestTopbarUpdate, { passive: true });
  window.addEventListener("resize", requestTopbarUpdate);
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change", requestTopbarUpdate);
  updateTopbar();

  const dropdowns = [...document.querySelectorAll(".nav-dropdown")];
  const closeAll = (except) => {
    dropdowns.forEach((item) => {
      if (item === except) return;
      item.classList.remove("open");
      item.querySelector(".nav-trigger").setAttribute("aria-expanded", "false");
    });
  };

  dropdowns.forEach((item) => {
    const trigger = item.querySelector(".nav-trigger");
    item.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "touch") {
        closeAll(item); item.classList.add("open"); trigger.setAttribute("aria-expanded", "true");
      }
    });
    item.addEventListener("pointerleave", (event) => {
      if (event.pointerType !== "touch") { item.classList.remove("open"); trigger.setAttribute("aria-expanded", "false"); }
    });
    trigger.addEventListener("click", (event) => {
      if (event.detail > 0 && window.matchMedia("(hover: hover)").matches) return;
      const open = !item.classList.contains("open");
      closeAll(item);
      item.classList.toggle("open", open);
      trigger.setAttribute("aria-expanded", String(open));
    });
    item.querySelectorAll(".menu-panel a").forEach((link) => {
      link.addEventListener("click", () => {
        item.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      });
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".nav-dropdown")) closeAll();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAll();
      document.activeElement?.blur();
    }
  });
})();
