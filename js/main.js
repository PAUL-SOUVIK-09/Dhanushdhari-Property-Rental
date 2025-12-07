// improved main.js: robust sizing, gap detection, resize handling, smooth movement
document.addEventListener("DOMContentLoaded", () => {
  const cardsTrack = document.querySelector(".cards");
  const viewport = document.querySelector(".cards-wrapper");
  const prevBtn = document.querySelector(".arrow.left");
  const nextBtn = document.querySelector(".arrow.right");
  const cardElems = Array.from(document.querySelectorAll(".card"));

  if (!cardsTrack || cardElems.length === 0) return;

  let visible = 3;
  let index = 0;
  let cardWidth = 0;
  let gap = 20; // should match CSS gap (keep in sync)
  let maxIndex = 0;

  // Compute gap from CSS if available (safer)
  (function detectGap() {
    try {
      const cs = getComputedStyle(cardsTrack);
      const gapVal =
        cs.getPropertyValue("gap") || cs.getPropertyValue("column-gap");
      if (gapVal) {
        const px = parseFloat(gapVal);
        if (!isNaN(px)) gap = px;
      }
    } catch (e) {
      /* ignore */
    }
  })();

  function recalc() {
    const vw = viewport.clientWidth;
    if (vw <= 600) visible = 1;
    else if (vw <= 900) visible = 2;
    else visible = 3;

    // Calculate card width to exactly fit visible count with gaps
    cardWidth = (vw - gap * (visible - 1)) / visible;
    cardElems.forEach((c) => (c.style.width = Math.round(cardWidth) + "px"));

    maxIndex = Math.max(0, cardElems.length - visible);
    index = Math.min(index, maxIndex);
    update();
  }

  function update() {
    const moveX = -(index * (cardWidth + gap));
    cardsTrack.style.transform = `translateX(${moveX}px)`;
    // accessibility: disable when can't move
    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= maxIndex;
  }

  // Arrow click handlers: move by 1 card (change to `visible` for page jumps)
  prevBtn.addEventListener("click", () => {
    if (index <= 0) return;
    index = Math.max(0, index - 1);
    update();
  });
  nextBtn.addEventListener("click", () => {
    if (index >= maxIndex) return;
    index = Math.min(maxIndex, index + 1);
    update();
  });

  // keyboard nav
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") prevBtn.click();
    if (e.key === "ArrowRight") nextBtn.click();
  });

  // touch swipe support (small, friendly)
  (function addSwipe() {
    let startX = 0,
      deltaX = 0,
      swiping = false;
    viewport.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
        swiping = true;
        cardsTrack.style.transition = "none";
      },
      { passive: true }
    );
    viewport.addEventListener(
      "touchmove",
      (e) => {
        if (!swiping) return;
        deltaX = e.touches[0].clientX - startX;
        cardsTrack.style.transform = `translateX(${
          -(index * (cardWidth + gap)) + deltaX
        }px)`;
      },
      { passive: true }
    );
    viewport.addEventListener("touchend", () => {
      cardsTrack.style.transition = "";
      if (Math.abs(deltaX) > cardWidth * 0.25) {
        if (deltaX < 0 && index < maxIndex) index++;
        if (deltaX > 0 && index > 0) index--;
      }
      deltaX = 0;
      swiping = false;
      update();
    });
  })();

  // ensure images loaded before initial layout
  const imgs = Array.from(cardsTrack.querySelectorAll("img"));
  const imgPromises = imgs.map((img) => {
    return img.complete
      ? Promise.resolve()
      : new Promise((res) => img.addEventListener("load", res));
  });

  Promise.all(imgPromises).then(() => {
    recalc();
    // recalc on resize (debounced)
    let to;
    window.addEventListener("resize", () => {
      clearTimeout(to);
      to = setTimeout(recalc, 90);
    });
  });
});
