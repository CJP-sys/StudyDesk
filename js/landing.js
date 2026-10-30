(() => {
  const section = document.querySelector(".dashboard-reveal");
  const frame = document.querySelector(".desk-frame");
  if (!section || !frame) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let pending = false;

  function updateReveal() {
    pending = false;
    const bounds = section.getBoundingClientRect();
    const range = Math.max(1, section.offsetHeight - window.innerHeight);
    const progress = reduceMotion.matches
      ? 1
      : Math.max(0, Math.min(1, -bounds.top / range));
    const eased = 1 - Math.pow(1 - progress, 2.4);
    const compact = window.matchMedia("(max-width: 760px)").matches;
    const startWidth = compact ? 90 : 88;
    const startHeight = compact ? 58 : 68;

    frame.style.width = `${startWidth + (100 - startWidth) * eased}vw`;
    frame.style.height = `${startHeight + (90 - startHeight) * eased}vh`;
    const heading = section.querySelector(".reveal-heading");
    heading.style.opacity = (1 - Math.min(1, eased * 1.8)).toFixed(3);
    heading.style.transform = `translateY(${-18 * eased}px)`;
    frame.style.borderRadius = `${28 - 22 * eased}px`;
    frame.style.setProperty("--reveal", eased.toFixed(3));
  }

  function requestUpdate() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(updateReveal);
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  reduceMotion.addEventListener?.("change", requestUpdate);
  updateReveal();
})();
