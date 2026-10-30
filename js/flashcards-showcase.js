(() => {
  const feature = document.querySelector('.feature-example[data-panel="flashcards"]');
  if (!feature) return;

  const demo = feature.querySelector(".flash-demo");
  const card = demo.querySelector(".flash-main-card");
  const flipButton = demo.querySelector(".flash-flip");
  const question = demo.querySelector(".flash-question");
  const answer = demo.querySelector(".flash-answer");
  const counter = demo.querySelectorAll(".flash-counter");
  const deck = [
    {
      question: "What is active recall?",
      answer: "Actively bringing information to mind helps strengthen your memory.",
    },
    {
      question: "What do plants make from light?",
      answer: "They turn light, water, and carbon dioxide into sugars through photosynthesis.",
    },
    {
      question: "What is one benefit of spaced practice?",
      answer: "Reviewing over time helps knowledge last longer than cramming in one sitting.",
    },
  ];
  let index = 0;

  const setFlipped = (flipped) => {
    card.classList.toggle("is-flipped", flipped);
    card.setAttribute("aria-pressed", String(flipped));
    card.setAttribute(
      "aria-label",
      flipped
        ? `Flashcard answer: ${deck[index].answer}. Activate to see the question again.`
        : `Flip flashcard. Question: ${deck[index].question}`,
    );
    flipButton.innerHTML = flipped
      ? 'See question <span aria-hidden="true">↻</span>'
      : 'Flip card <span aria-hidden="true">↻</span>';
  };

  card.addEventListener("click", () => setFlipped(!card.classList.contains("is-flipped")));
  flipButton.addEventListener("click", () => setFlipped(!card.classList.contains("is-flipped")));
  demo.querySelector(".flash-next").addEventListener("click", () => {
    index = (index + 1) % deck.length;
    question.textContent = deck[index].question;
    answer.textContent = deck[index].answer;
    counter.forEach((item) => (item.textContent = `${String(index + 1).padStart(2, "0")} / 03`));
    setFlipped(false);
    card.classList.remove("deal-again");
    void card.offsetWidth;
    card.classList.add("deal-again");
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          feature.classList.add("in-view");
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(feature);
  } else {
    feature.classList.add("in-view");
  }
})();
